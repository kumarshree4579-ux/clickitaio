import { Router, Request, Response } from 'express';
import { Banner } from '../models/banner';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { type } = req.query;
  const filter: any = { isActive: true };
  if (type) filter.type = type;
  const banners = await Banner.find(filter).sort({ sortOrder: 1 });
  return res.json(banners);
});

router.get('/admin', requireAuth, requireRole('super_admin'), async (_req, res: Response) => {
  const banners = await Banner.find().sort({ type: 1, sortOrder: 1 });
  return res.json(banners);
});

router.post('/', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  try {
    const banner = await Banner.create(req.body);
    return res.status(201).json(banner);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!banner) return res.status(404).json({ error: 'Not found' });
  return res.json(banner);
});

router.delete('/:id', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  await Banner.findByIdAndDelete(req.params.id);
  return res.json({ success: true });
});

export default router;
