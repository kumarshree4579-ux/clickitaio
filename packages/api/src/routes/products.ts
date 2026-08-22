import { Router, Request, Response } from 'express';
import { Product } from '../models/product';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { validate, ProductSchema } from '../utils/validation';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', q, category, subCategory, brand, status = 'active', featured, newArrival, bestSeller } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter: any = { status };
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (brand) filter.brand = brand;
    if (featured === 'true') filter.isFeatured = true;
    if (newArrival === 'true') filter.isNewArrival = true;
    if (bestSeller === 'true') filter.isBestSeller = true;
    const [items, total] = await Promise.all([
      Product.find(filter).populate('category', 'name slug').populate('subCategory', 'name slug').populate('brand', 'name').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);
    return res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /products/suggest?q= — autocomplete, grouped by category, max 8 results
router.get('/suggest', async (req: Request, res: Response) => {
  const { q } = req.query as any;
  if (!q || String(q).trim().length < 2) return res.json([]);
  try {
    const regex = new RegExp(String(q).trim(), 'i');
    const products = await Product.find(
      { status: 'active', $or: [{ name: regex }, { tags: regex }] },
      'name slug images category sellingPrice mrp'
    )
      .populate('category', 'name')
      .limit(20)
      .lean();

    // Group by category, max 3 per category, total cap 8
    const groups: Record<string, { categoryName: string; items: any[] }> = {};
    for (const p of products) {
      const cat = (p.category as any);
      const key = cat?._id?.toString() || 'uncategorised';
      const label = cat?.name || 'Other';
      if (!groups[key]) groups[key] = { categoryName: label, items: [] };
      if (groups[key].items.length < 3) {
        groups[key].items.push({
          _id: p._id,
          name: p.name,
          image: (p.images as any[])[0]?.url || null,
          sellingPrice: p.sellingPrice,
          mrp: p.mrp,
        });
      }
    }

    // Flatten to max 8 total
    const result: any[] = [];
    for (const g of Object.values(groups)) {
      if (result.length >= 8) break;
      result.push({ categoryName: g.categoryName, items: g.items.slice(0, 8 - result.length) });
    }
    return res.json(result);
  } catch {
    return res.status(500).json([]);
  }
});

// GET /products/suggest?q= — autocomplete grouped by category, max 8 total
router.get('/suggest', async (req: Request, res: Response) => {
  const { q } = req.query as any;
  if (!q || String(q).trim().length < 2) return res.json([]);
  try {
    const regex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const products = await Product.find(
      { status: 'active', $or: [{ name: regex }, { tags: regex }] },
      'name slug images category sellingPrice mrp'
    ).populate('category', 'name').limit(24).lean();

    // Group by category, max 3 per category
    const groups: Record<string, { categoryName: string; items: any[] }> = {};
    for (const p of products) {
      const cat = p.category as any;
      const key = cat?._id?.toString() || '__none__';
      const label = cat?.name || 'Other';
      if (!groups[key]) groups[key] = { categoryName: label, items: [] };
      if (groups[key].items.length < 3) {
        groups[key].items.push({
          _id: p._id,
          name: p.name,
          image: (p.images as any[])[0]?.url || null,
          sellingPrice: p.sellingPrice,
          mrp: p.mrp,
        });
      }
    }

    // Cap total at 8
    const result: any[] = [];
    let total = 0;
    for (const g of Object.values(groups)) {
      if (total >= 8) break;
      const slice = g.items.slice(0, 8 - total);
      result.push({ categoryName: g.categoryName, items: slice });
      total += slice.length;
    }
    return res.json(result);
  } catch {
    return res.status(500).json([]);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id).populate('category subCategory brand');
  if (!product) return res.status(404).json({ error: 'Not found' });
  return res.json(product);
});

router.post('/', requireAuth, requireRole('super_admin', 'inventory_staff'), validate(ProductSchema), async (req: AuthedRequest, res: Response) => {
  try {
    const product = await Product.create(req.body);
    return res.status(201).json(product);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireRole('super_admin', 'inventory_staff'), validate(ProductSchema.partial()), async (req: AuthedRequest, res: Response) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ error: 'Not found' });
  return res.json(product);
});

router.delete('/:id', requireAuth, requireRole('super_admin'), async (req: AuthedRequest, res: Response) => {
  await Product.findByIdAndDelete(req.params.id);
  return res.json({ success: true });
});

export default router;
