import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { uploadBufferToCloudinary } from '../utils/cloudinary';
import { deleteFromCloudinary } from '../utils/cloudinary';
import { requireAuth, AuthedRequest, requireAdmin } from '../middleware/auth';
import { Media } from '../models/media';
import { Product } from '../models/product';

const router = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

const ALLOWED_FOLDERS: Record<string, string> = {
  products: 'ecom/products',
  banners: 'ecom/banners',
  categories: 'ecom/categories',
  brands: 'ecom/brands',
  media: 'ecom/media',
};

// ─── Single file upload (existing) ───
router.post('/', requireAuth, requireAdmin, upload.single('file'), async (req: AuthedRequest, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'File is required' });
    const folderKey = (req.query.folder as string) || 'products';
    const folder = ALLOWED_FOLDERS[folderKey] || 'ecom/products';
    const result = await uploadBufferToCloudinary(file.buffer, folder);
    return res.json({ success: true, url: result.url, public_id: result.public_id });
  } catch (err) {
    console.error('upload error', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// ─── Bulk file upload (new) ───
// Accepts up to 20 files per request (browser sends multiple batches)
// Files arrive already processed (WebP, metadata stripped) from client-side
router.post('/bulk', requireAuth, requireAdmin, upload.array('files', 20), async (req: AuthedRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files provided' });

    const batchId = req.body.batchId || crypto.randomUUID();
    const uploaded: { originalName: string; url: string; public_id: string }[] = [];

    for (const file of files) {
      try {
        const result = await uploadBufferToCloudinary(file.buffer, 'ecom/media');
        const originalName = file.originalname || 'unknown';

        await Media.create({
          originalName,
          url: result.url,
          public_id: result.public_id,
          uploadedBy: req.user!.sub,
          batchId,
          size: file.size || file.buffer.length,
        });

        uploaded.push({ originalName, url: result.url, public_id: result.public_id });

        // Auto-map this newly uploaded image to products waiting for it
        await Product.updateMany(
          { pendingImages: originalName },
          { 
            $push: { images: { url: result.url, public_id: result.public_id, alt: originalName } },
            $pull: { pendingImages: originalName }
          }
        );
      } catch {
        // Skip failed files silently
      }
    }

    return res.json({ batchId, uploaded, count: uploaded.length });
  } catch (err) {
    console.error('bulk upload error', err);
    return res.status(500).json({ error: 'Bulk upload failed' });
  }
});

// ─── Bulk delete media (deletes from Cloudinary + DB) ───
router.delete('/media/bulk', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    const mediaItems = await Media.find({ _id: { $in: ids } });
    let deleted = 0;

    for (const item of mediaItems) {
      try {
        await deleteFromCloudinary(item.public_id);
        await Media.findByIdAndDelete(item._id);
        deleted++;
      } catch {
        // Skip failures silently
      }
    }

    return res.json({ deleted, total: ids.length });
  } catch (err) {
    console.error('bulk delete error', err);
    return res.status(500).json({ error: 'Bulk delete failed' });
  }
});

export default router;
