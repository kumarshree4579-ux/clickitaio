import { Router, Response } from 'express';
import { Media } from '../models/media';
import { Product } from '../models/product';
import { deleteFromCloudinary } from '../utils/cloudinary';
import { requireAuth, requireAdmin, AuthedRequest } from '../middleware/auth';

const router = Router();

// ─── GET /media — paginated list with filters ───
router.get('/', requireAuth, requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { page = '1', limit = '40', filter = 'all', q = '' } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const lim = parseInt(limit);

    const query: any = {};
    if (q) {
      query.originalName = { $regex: q, $options: 'i' };
    }

    // Get all media matching query
    const [items, total] = await Promise.all([
      Media.find(query).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      Media.countDocuments(query),
    ]);

    // If filter requires link status, cross-reference with products
    if (filter !== 'all') {
      const mediaUrls = items.map(m => m.url);
      const linkedProducts = await Product.find(
        { 'images.url': { $in: mediaUrls } },
        { 'images.url': 1 }
      ).lean();

      // Build a map of url → count
      const urlCountMap: Record<string, number> = {};
      for (const p of linkedProducts) {
        for (const img of p.images) {
          urlCountMap[img.url] = (urlCountMap[img.url] || 0) + 1;
        }
      }

      // Attach link count to items
      const enriched = items.map(m => ({
        ...m,
        linkCount: urlCountMap[m.url] || 0,
      }));

      let filtered = enriched;
      if (filter === 'unlinked') filtered = enriched.filter(m => m.linkCount === 0);
      else if (filter === 'linked') filtered = enriched.filter(m => m.linkCount > 0);
      else if (filter === 'multi') filtered = enriched.filter(m => m.linkCount > 1);

      return res.json({ items: filtered, total: filtered.length, page: parseInt(page), limit: lim });
    }

    // For 'all' filter, still attach link counts
    const mediaUrls = items.map(m => m.url);
    const linkedProducts = await Product.find(
      { 'images.url': { $in: mediaUrls } },
      { 'images.url': 1 }
    ).lean();
    const urlCountMap: Record<string, number> = {};
    for (const p of linkedProducts) {
      for (const img of p.images) {
        urlCountMap[img.url] = (urlCountMap[img.url] || 0) + 1;
      }
    }
    const enriched = items.map(m => ({ ...m, linkCount: urlCountMap[m.url] || 0 }));

    return res.json({ items: enriched, total, page: parseInt(page), limit: lim });
  } catch (err) {
    console.error('media list error', err);
    return res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// ─── GET /media/ids — get all IDs matching filter ───
router.get('/ids', requireAuth, requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { filter = 'all', q = '' } = req.query as any;

    const query: any = {};
    if (q) {
      query.originalName = { $regex: q, $options: 'i' };
    }

    // Get all media matching query
    const items = await Media.find(query).select('_id url').lean();

    if (filter !== 'all') {
      const mediaUrls = items.map(m => m.url);
      const linkedProducts = await Product.find(
        { 'images.url': { $in: mediaUrls } },
        { 'images.url': 1 }
      ).lean();

      const urlCountMap: Record<string, number> = {};
      for (const p of linkedProducts) {
        for (const img of p.images) {
          urlCountMap[img.url] = (urlCountMap[img.url] || 0) + 1;
        }
      }

      const enriched = items.map(m => ({
        ...m,
        linkCount: urlCountMap[m.url] || 0,
      }));

      let filtered = enriched;
      if (filter === 'unlinked') filtered = enriched.filter(m => m.linkCount === 0);
      else if (filter === 'linked') filtered = enriched.filter(m => m.linkCount > 0);
      else if (filter === 'multi') filtered = enriched.filter(m => m.linkCount > 1);

      return res.json({ ids: filtered.map(m => m._id) });
    }

    return res.json({ ids: items.map(m => m._id) });
  } catch (err) {
    console.error('media ids error', err);
    return res.status(500).json({ error: 'Failed to fetch media ids' });
  }
});

// ─── GET /media/:id/products — products linked to this image ───
router.get('/:id/products', requireAuth, requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'Media not found' });

    const products = await Product.find(
      { 'images.url': media.url },
      { name: 1, sku: 1, slug: 1, images: 1 }
    ).lean();

    return res.json(products);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch linked products' });
  }
});

// ─── DELETE /media/:id — single delete from Cloudinary + DB ───
router.delete('/:id', requireAuth, requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'Media not found' });

    try { await deleteFromCloudinary(media.public_id); } catch {}
    await Media.findByIdAndDelete(media._id);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;
