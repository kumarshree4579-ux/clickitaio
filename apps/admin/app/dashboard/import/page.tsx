'use client';
import { useRef, useState } from 'react';
import { processAndUpload, UploadProgress } from '../../../lib/imageProcessor';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token') || '';

export default function ImportPage() {
  // ─── Media Upload State ───
  const mediaRef = useRef<HTMLInputElement>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaProgress, setMediaProgress] = useState<UploadProgress | null>(null);
  const [mediaResult, setMediaResult] = useState<{ uploaded: number; failed: number } | null>(null);

  // ─── CSV Import State ───
  const csvRef = useRef<HTMLInputElement>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState('');

  // ─── Media Upload Handlers ───
  function handleMediaSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) setMediaFiles(Array.from(files));
  }

  async function startMediaUpload() {
    if (mediaFiles.length === 0) return;
    setMediaResult(null);

    const result = await processAndUpload(
      mediaFiles,
      API!,
      token(),
      (progress) => setMediaProgress(progress)
    );

    setMediaResult({ uploaded: result.uploaded, failed: result.failed });
    setMediaFiles([]);
    if (mediaRef.current) mediaRef.current.value = '';
  }

  // ─── CSV Import Handlers ───
  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    const file = csvRef.current?.files?.[0];
    if (!file) return;
    setImporting(true); setImportError(''); setImportResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/import/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      if (!res.ok) { const e = await res.json(); setImportError(e.error || 'Import failed'); return; }
      setImportResult(await res.json());
      setCsvFileName('');
      if (csvRef.current) csvRef.current.value = '';
    } catch {
      setImportError('Network error');
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const headers = [
      'SKU', 'Product Name', 'Barcode', 'Category', 'Sub Category', 'Brand',
      'MRP', 'Selling Price', 'Cost Price', 'GST', 'Stock', 'Min Stock',
      'Short Description', 'Description', 'Weight', 'Warranty', 'Return Policy',
      'Tags', 'Images', 'Status', 'Featured', 'New Arrival', 'Best Seller',
      'Trending', 'Meta Title', 'Meta Description',
    ];
    const sample = [
      'SKU001', 'Sample Product', '1234567890', 'Electronics', 'Mobile Accessories', 'Samsung',
      '999', '799', '500', '18', '50', '5',
      'A great product', 'Detailed description here...', '250', '1 Year', '7 Days Return',
      'tag1,tag2,tag3', '3827.jpg|3828.jpg', 'active', 'true', 'false', 'true',
      'false', 'Sample Product - Buy Online', 'Best price for sample product',
    ];
    const csv = [headers.join(','), sample.map(v => `"${v}"`).join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'product_import_template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const progressPercent = mediaProgress
    ? mediaProgress.phase === 'processing'
      ? Math.round((mediaProgress.processed / mediaProgress.total) * 50)
      : 50 + Math.round((mediaProgress.uploaded / mediaProgress.total) * 50)
    : 0;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Bulk Import</h1>
        <p className="text-sm text-gray-500 mt-1">Upload media files first, then import products via CSV</p>
      </div>

      {/* ═══════════════ STEP 1: BULK MEDIA UPLOAD ═══════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center font-bold text-sm">1</div>
          <div>
            <h2 className="font-bold text-gray-900">Upload Media</h2>
            <p className="text-xs text-gray-500">Select images (any format, 10K+ supported). Auto-converted to WebP.</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* File selector */}
          <label
            className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-violet-400 transition-colors cursor-pointer"
            htmlFor="media-input"
          >
            <p className="text-3xl mb-2">🖼️</p>
            {mediaFiles.length > 0 ? (
              <p className="text-sm font-semibold text-violet-600">{mediaFiles.length.toLocaleString()} images selected</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 font-medium">Click to select images</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, BMP, GIF, TIFF, AVIF — any format</p>
              </>
            )}
            <input
              ref={mediaRef}
              id="media-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleMediaSelect}
            />
          </label>

          {/* Progress */}
          {mediaProgress && mediaProgress.phase !== 'done' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {mediaProgress.phase === 'processing'
                    ? `Processing ${mediaProgress.processed.toLocaleString()} / ${mediaProgress.total.toLocaleString()}`
                    : `Uploading ${mediaProgress.uploaded.toLocaleString()} / ${mediaProgress.total.toLocaleString()}`}
                </span>
                <span className="font-bold">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400">
                {mediaProgress.phase === 'processing' ? 'Converting to WebP & stripping metadata...' : 'Uploading to cloud storage...'}
              </p>
            </div>
          )}

          {/* Result */}
          {mediaResult && (
            <div className="flex gap-3">
              <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-emerald-700">{mediaResult.uploaded.toLocaleString()}</p>
                <p className="text-[11px] font-medium text-emerald-600">Uploaded</p>
              </div>
              {mediaResult.failed > 0 && (
                <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-700">{mediaResult.failed.toLocaleString()}</p>
                  <p className="text-[11px] font-medium text-red-600">Skipped</p>
                </div>
              )}
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={startMediaUpload}
            disabled={mediaFiles.length === 0 || (mediaProgress !== null && mediaProgress.phase !== 'done')}
            className="w-full bg-violet-600 text-white py-3 rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {mediaProgress && mediaProgress.phase !== 'done'
              ? 'Processing...'
              : `Process & Upload${mediaFiles.length > 0 ? ` (${mediaFiles.length.toLocaleString()} files)` : ''}`}
          </button>
        </div>
      </div>

      {/* ═══════════════ STEP 2: CSV IMPORT ═══════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">2</div>
          <div>
            <h2 className="font-bold text-gray-900">Import Products (CSV / Excel)</h2>
            <p className="text-xs text-gray-500">Use pipe-separated filenames in the Images column (e.g., 3827.jpg|3828.jpg)</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Column format:</p>
            <p className="font-mono text-[11px] bg-blue-100 p-2 rounded overflow-x-auto">
              SKU, Product Name, Barcode, Category, Sub Category, Brand, MRP, Selling Price, Cost Price, GST, Stock, Min Stock, Short Description, Description, Weight, Warranty, Return Policy, Tags, Images, Status, Featured, New Arrival, Best Seller, Trending, Meta Title, Meta Description
            </p>
            <p>• <strong>Images:</strong> pipe-separated filenames: <code className="bg-blue-100 px-1 rounded">3827.jpg|3828.jpg</code></p>
            <p>• <strong>Category/Brand:</strong> auto-created if not found</p>
            <p>• <strong>Missing images:</strong> product still created, shown in report</p>
          </div>

          {/* CSV upload form */}
          <form onSubmit={handleImport} className="space-y-4">
            <label
              htmlFor="csv-input"
              className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
            >
              <p className="text-3xl mb-2">📊</p>
              {csvFileName
                ? <p className="text-sm font-semibold text-blue-600">{csvFileName}</p>
                : <>
                    <p className="text-sm text-gray-600 font-medium">Upload Excel (.xlsx) or CSV</p>
                    <p className="text-xs text-gray-400 mt-1">Click to choose file</p>
                  </>}
              <input
                ref={csvRef}
                id="csv-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={e => setCsvFileName(e.target.files?.[0]?.name || '')}
              />
            </label>

            {importError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{importError}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={importing || !csvFileName}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
              >
                {importing ? 'Importing...' : 'Import Products'}
              </button>
              <button
                type="button"
                onClick={downloadTemplate}
                className="border border-gray-200 px-4 py-3 rounded-lg text-sm hover:bg-gray-50 font-medium text-gray-700"
              >
                ⬇ Template
              </button>
            </div>
          </form>

          {/* Import Results */}
          {importResult && (
            <div className="border-t border-gray-100 pt-4 space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: 'Total', value: importResult.summary.total, color: 'bg-gray-100 text-gray-700' },
                  { label: 'Created', value: importResult.summary.created, color: 'bg-emerald-100 text-emerald-700' },
                  { label: 'Updated', value: importResult.summary.updated, color: 'bg-blue-100 text-blue-700' },
                  { label: 'Skipped', value: importResult.summary.skipped || 0, color: 'bg-yellow-100 text-yellow-700' },
                  { label: 'Errors', value: importResult.summary.errors, color: 'bg-red-100 text-red-700' },
                ].map(s => (
                  <div key={s.label} className={`${s.color} rounded-lg p-3 text-center`}>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Row errors */}
              {importResult.results?.filter((r: any) => r.status === 'error').length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto border border-red-100">
                  <p className="text-xs font-bold text-red-700 mb-1">Row Errors:</p>
                  {importResult.results.filter((r: any) => r.status === 'error').map((r: any) => (
                    <p key={r.row} className="text-xs text-red-600">Row {r.row} ({r.sku}): {r.error}</p>
                  ))}
                </div>
              )}

              {/* Missing images report */}
              {importResult.missingImages?.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto border border-amber-200">
                  <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                    <span>⚠️</span> Missing Images ({importResult.missingImages.length})
                  </p>
                  <p className="text-[11px] text-amber-600 mb-2">These products were created/updated but the listed images were not found in Media Gallery:</p>
                  <div className="space-y-0.5">
                    {importResult.missingImages.map((m: any, i: number) => (
                      <p key={i} className="text-xs text-amber-700 font-mono">
                        Row {m.row} • <span className="font-semibold">{m.sku}</span> → <code className="bg-amber-100 px-1 rounded">{m.filename}</code>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
