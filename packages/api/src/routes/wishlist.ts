import { Router, Response } from 'express';
import { Wishlist } from '../models/wishlist';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  const items = await Wishlist.find({ customer: req.user!.sub })
    .populate('product', 'name slug sellingPrice mrp images stock status')
    .sort({ createdAt: -1 });
  return res.json(items);
});

router.post('/:productId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const item = await Wishlist.create({ customer: req.user!.sub, product: req.params.productId });
    return res.status(201).json(item);
  } catch (err: any) {
    if (err.code === 11000) return res.status(400).json({ error: 'Already in wishlist' });
    return res.status(400).json({ error: err.message });
  }
});

router.delete('/:productId', requireAuth, async (req: AuthedRequest, res: Response) => {
  await Wishlist.findOneAndDelete({ customer: req.user!.sub, product: req.params.productId });
  return res.json({ success: true });
});

// Check if product is in wishlist
router.get('/check/:productId', requireAuth, async (req: AuthedRequest, res: Response) => {
  const item = await Wishlist.findOne({ customer: req.user!.sub, product: req.params.productId });
  return res.json({ inWishlist: !!item });
});

export default router;
