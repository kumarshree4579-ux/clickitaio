import { Router } from 'express';
import multer from 'multer';
import { uploadBufferToCloudinary } from '../utils/cloudinary';
import { requireAuth, AuthedRequest, requireAdmin } from '../middleware/auth';

const router = Router();
const upload = multer(); // in-memory

// POST /uploads (admin only) form-data: file
router.post('/', requireAuth, requireAdmin, upload.single('file'), async (req: AuthedRequest, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'File is required' });
    const folder = 'ecom/products';
    const result = await uploadBufferToCloudinary(file.buffer, folder);
    return res.json({ success: true, url: result.url, public_id: result.public_id });
  } catch (err) {
    console.error('upload error', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
