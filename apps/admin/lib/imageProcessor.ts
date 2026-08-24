/**
 * Client-side image processor.
 * Converts any image format to WebP using Canvas API.
 * Strips ALL metadata (EXIF, IPTC, XMP) — Canvas only outputs pixel data.
 * Designed to handle 10,000+ images by processing in controlled batches.
 */

export interface ProcessedFile {
  blob: Blob;
  originalName: string;
}

export interface UploadProgress {
  phase: 'processing' | 'uploading' | 'done';
  processed: number;
  uploaded: number;
  total: number;
  failed: number;
}

const WEBP_QUALITY = 0.80;
const MAX_DIMENSION = 1600; // Max width/height — prevents huge uploads

/**
 * Process a single image file:
 * 1. Decode as ImageBitmap
 * 2. Draw on canvas (resizes if too large)
 * 3. Export as WebP — strips all metadata
 */
export async function processImage(file: File): Promise<ProcessedFile | null> {
  try {
    const bitmap = await createImageBitmap(file);

    let width = bitmap.width;
    let height = bitmap.height;

    // Scale down if either dimension exceeds max
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Use OffscreenCanvas if available (Web Worker friendly), else regular Canvas
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(width, height);
      ctx = canvas.getContext('2d');
    } else {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext('2d');
    }

    if (!ctx) return null;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    // Export as WebP blob
    let blob: Blob;
    if (canvas instanceof OffscreenCanvas) {
      blob = await canvas.convertToBlob({ type: 'image/webp', quality: WEBP_QUALITY });
    } else {
      blob = await new Promise<Blob>((resolve, reject) => {
        (canvas as HTMLCanvasElement).toBlob(
          b => b ? resolve(b) : reject(new Error('toBlob failed')),
          'image/webp',
          WEBP_QUALITY
        );
      });
    }

    return { blob, originalName: file.name };
  } catch {
    // Skip unsupported/corrupt files silently
    return null;
  }
}

/**
 * Process multiple files in controlled batches.
 * Processes PROCESS_BATCH_SIZE at a time to avoid memory spikes.
 */
const PROCESS_BATCH_SIZE = 10;

export async function processFiles(
  files: File[],
  onProgress?: (processed: number, total: number) => void
): Promise<ProcessedFile[]> {
  const results: ProcessedFile[] = [];
  const total = files.length;

  for (let i = 0; i < total; i += PROCESS_BATCH_SIZE) {
    const batch = files.slice(i, i + PROCESS_BATCH_SIZE);
    const processed = await Promise.all(batch.map(f => processImage(f)));

    for (const p of processed) {
      if (p) results.push(p);
    }

    onProgress?.(Math.min(i + PROCESS_BATCH_SIZE, total), total);
  }

  return results;
}

/**
 * Upload processed files to server in batches.
 * Sends UPLOAD_BATCH_SIZE files per request, with CONCURRENT_BATCHES in parallel.
 */
const UPLOAD_BATCH_SIZE = 20;
const CONCURRENT_BATCHES = 5;

export interface UploadResult {
  uploaded: number;
  failed: number;
  batchId: string;
}

/**
 * Full pipeline: select files → process in browser → upload to server.
 * Streams chunks of UPLOAD_BATCH_SIZE files with CONCURRENT_BATCHES workers
 * to keep memory usage minimal.
 */
export async function processAndUpload(
  files: File[],
  apiUrl: string,
  token: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const batchId = crypto.randomUUID();
  let uploaded = 0;
  let failed = 0;
  let processedCount = 0;
  const total = files.length;

  onProgress?.({ phase: 'processing', processed: 0, uploaded: 0, total, failed: 0 });

  // Split raw files into chunks of UPLOAD_BATCH_SIZE
  const chunks: File[][] = [];
  for (let i = 0; i < total; i += UPLOAD_BATCH_SIZE) {
    chunks.push(files.slice(i, i + UPLOAD_BATCH_SIZE));
  }

  const queue = [...chunks];
  const workers: Promise<void>[] = [];

  for (let w = 0; w < CONCURRENT_BATCHES; w++) {
    workers.push((async () => {
      while (queue.length > 0) {
        const chunk = queue.shift();
        if (!chunk) break;

        try {
          // 1. Process this chunk
          const processedChunk = await processFiles(chunk);
          processedCount += chunk.length;
          onProgress?.({ phase: 'uploading', processed: processedCount, uploaded, total, failed });

          // 2. Upload this chunk
          if (processedChunk.length > 0) {
            const formData = new FormData();
            formData.append('batchId', batchId);

            for (const file of processedChunk) {
              formData.append('files', file.blob, file.originalName);
            }

            let success = false;
            let attempts = 0;
            const maxAttempts = 3;

            while (!success && attempts < maxAttempts) {
              attempts++;
              try {
                const res = await fetch(`${apiUrl}/uploads/bulk`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` },
                  body: formData,
                });

                if (res.ok) {
                  const data = await res.json();
                  uploaded += data.count || 0;
                  failed += chunk.length - (data.count || 0);
                  success = true;
                } else if (res.status === 401 || res.status === 403) {
                  // No point retrying auth errors
                  break;
                } else {
                  if (attempts < maxAttempts) await new Promise(r => setTimeout(r, 1000 * attempts));
                }
              } catch {
                if (attempts < maxAttempts) await new Promise(r => setTimeout(r, 1000 * attempts));
              }
            }

            if (!success) {
              failed += chunk.length;
            }
          } else {
            failed += chunk.length;
          }
        } catch {
          failed += chunk.length;
        }

        onProgress?.({ phase: 'uploading', processed: processedCount, uploaded, total, failed });
      }
    })());
  }

  await Promise.all(workers);
  
  onProgress?.({ phase: 'done', processed: processedCount, uploaded, total, failed });

  return { uploaded, failed, batchId };
}
