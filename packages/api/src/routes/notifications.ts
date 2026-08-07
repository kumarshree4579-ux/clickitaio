import { Router, Request, Response } from 'express';
import { Notification } from '../models/notification';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Public: active notifications within date range
router.get('/', async (_req: Request, res: Response) => {
  const now = new Date();
  const filter: any = { isActive: true };
  filter.$or = [{ startsAt: { $lte: now } }, { startsAt: null }];
  filter.$and = [{ $or: [{ endsAt: { $gte: now } }, { endsAt: null }] }];
  const notifications = await Notification.find(filter).sort({ createdAt: -1 });
  return res.json(notifications);
});

// Admin: all notifications
router.get('/admin', requireAuth, requireRole('super_admin'), async (_req, res: Response) => {
  const notifications = await Notification.find().sort({ createdAt: -1 });
  return res.json(notifications);
});

router.post('/', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  try {
    const n = await Notification.create(req.body);
    return res.status(201).json(n);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  const n = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!n) return res.status(404).json({ error: 'Not found' });
  return res.json(n);
});

router.delete('/:id', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  await Notification.findByIdAndDelete(req.params.id);
  return res.json({ success: true });
});

export default router;
