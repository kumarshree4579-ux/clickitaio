import { Router, Request, Response } from 'express';
import { Category } from '../models/category';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const cats = await Category.find().populate('parent', 'name slug').sort({ name: 1 });
  return res.json(cats);
});

router.post('/', requireAuth, requireRole('super_admin', 'inventory_staff'), async (req: Request, res: Response) => {
  try {
    const cat = await Category.create(req.body);
    return res.status(201).json(cat);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireRole('super_admin', 'inventory_staff'), async (req: Request, res: Response) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cat) return res.status(404).json({ error: 'Not found' });
  return res.json(cat);
});

router.delete('/:id', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  await Category.findByIdAndDelete(req.params.id);
  return res.json({ success: true });
});

export default router;
