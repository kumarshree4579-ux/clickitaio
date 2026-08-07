import { Router, Request, Response } from 'express';
import { Product } from '../models/product';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { validate, ProductSchema } from '../utils/validation';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', q, category, brand, status = 'active', featured, newArrival, bestSeller } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter: any = { status };
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (featured === 'true') filter.isFeatured = true;
    if (newArrival === 'true') filter.isNewArrival = true;
    if (bestSeller === 'true') filter.isBestSeller = true;
    const [items, total] = await Promise.all([
      Product.find(filter).populate('category', 'name slug').populate('brand', 'name').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);
    return res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id).populate('category brand');
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
