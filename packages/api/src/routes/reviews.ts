import { Router, Request, Response } from 'express';
import { Review } from '../models/review';
import { Order } from '../models/order';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { sanitizeText } from '../utils/sanitize';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { product, status = 'approved', page = '1', limit = '10' } = req.query as any;
  const filter: any = { status };
  if (product) filter.product = product;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [items, total] = await Promise.all([
    Review.find(filter).populate('customer', 'name email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Review.countDocuments(filter),
  ]);
  return res.json({ items, total });
});

router.post('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { product, rating, orderId } = req.body;
    const title = sanitizeText(req.body.title);
    const body = sanitizeText(req.body.body);
    if (!product || !rating || !body) return res.status(400).json({ error: 'product, rating and body required' });
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({ _id: orderId, customer: req.user!.sub, status: 'delivered' });
      if (order) isVerifiedPurchase = true;
    }

    const review = await Review.create({ product, customer: req.user!.sub, order: orderId, rating: ratingNum, title, body, isVerifiedPurchase });
    return res.status(201).json(review);
  } catch (err: any) {
    if (err.code === 11000) return res.status(400).json({ error: 'You have already reviewed this product' });
    return res.status(400).json({ error: err.message });
  }
});

router.get('/admin', requireAuth, requireRole('super_admin'), async (_req, res: Response) => {
  const reviews = await Review.find().populate('customer', 'name email').populate('product', 'name').sort({ createdAt: -1 }).limit(100);
  return res.json(reviews);
});

router.put('/:id/status', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!review) return res.status(404).json({ error: 'Not found' });
  return res.json(review);
});

router.delete('/:id', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  await Review.findByIdAndDelete(req.params.id);
  return res.json({ success: true });
});

export default router;
