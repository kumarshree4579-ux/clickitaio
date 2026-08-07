import { Router, Request, Response } from 'express';
import { Category } from '../models/category';
import { Product } from '../models/product';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate, CategorySchema } from '../utils/validation';

const router = Router();

// GET /categories — includes firstProductImage fallback
router.get('/', async (_req: Request, res: Response) => {
  const cats = await Category.find().populate('parent', 'name slug').sort({ name: 1 });

  // Batch fetch one product image per category in a single query
  const catIds = cats.map(c => c._id);
  const products = await Product.find(
    { category: { $in: catIds }, status: 'active', 'images.0': { $exists: true } },
    'category images'
  ).lean();

  const imageMap: Record<string, string> = {};
  for (const p of products) {
    const key = p.category!.toString();
    if (!imageMap[key]) imageMap[key] = p.images[0].url;
  }

  const enriched = cats.map(cat => {
    const c = cat.toObject() as any;
    if (!c.image) c.image = imageMap[cat._id.toString()] || null;
    return c;
  });

  return res.json(enriched);
});

router.post('/', requireAuth, requireRole('super_admin', 'inventory_staff'), validate(CategorySchema), async (req: Request, res: Response) => {
  try {
    const cat = await Category.create(req.body);
    return res.status(201).json(cat);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireRole('super_admin', 'inventory_staff'), validate(CategorySchema.partial()), async (req: Request, res: Response) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cat) return res.status(404).json({ error: 'Not found' });
  return res.json(cat);
});

router.delete('/:id', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  await Category.findByIdAndDelete(req.params.id);
  return res.json({ success: true });
});

export default router;
