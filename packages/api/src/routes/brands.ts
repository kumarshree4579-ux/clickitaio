import { Router, Request, Response } from 'express';
import { Brand } from '../models/brand';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
  return res.json(brands);
});

router.post('/', requireAuth, requireRole('super_admin', 'inventory_staff'), async (req: Request, res: Response) => {
  try {
    const brand = await Brand.create(req.body);
    return res.status(201).json(brand);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireRole('super_admin', 'inventory_staff'), async (req: Request, res: Response) => {
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!brand) return res.status(404).json({ error: 'Not found' });
  return res.json(brand);
});

router.delete('/:id', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  await Brand.findByIdAndDelete(req.params.id);
  return res.json({ success: true });
});

export default router;
