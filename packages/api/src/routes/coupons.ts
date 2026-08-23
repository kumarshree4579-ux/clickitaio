import { Router, Request, Response } from 'express';
import { Coupon } from '../models/coupon';
import { Order } from '../models/order';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';

const router = Router();

// POST /coupons/validate — check coupon for a cart total
router.post('/validate', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { code, cartTotal } = req.body;
  if (!code || cartTotal == null) return res.status(400).json({ error: 'code and cartTotal required' });

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ error: 'Coupon has expired' });
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ error: 'Coupon usage limit reached' });
  if (cartTotal < coupon.minOrderAmount) return res.status(400).json({ error: `Minimum order amount is ₹${coupon.minOrderAmount}` });

  // per-customer limit check
  const customerUsage = await Order.countDocuments({ customer: req.user!.sub, couponCode: coupon.code });
  if (customerUsage >= coupon.perCustomerLimit) return res.status(400).json({ error: 'You have already used this coupon' });

  let discount = 0;
  if (coupon.type === 'flat') discount = coupon.value;
  else if (coupon.type === 'percentage') {
    discount = Math.round((cartTotal * coupon.value) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === 'free_shipping') discount = 0; // handled at checkout

  return res.json({ valid: true, coupon: { code: coupon.code, type: coupon.type, value: coupon.value, description: coupon.description }, discount });
});

// GET /coupons/available — get active coupons for customers
router.get('/available', requireAuth, async (req: AuthedRequest, res: Response) => {
  const coupons = await Coupon.find({ 
    isActive: true, 
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] 
  }).sort({ createdAt: -1 });
  return res.json(coupons);
});

// Admin CRUD
router.get('/', requireAuth, requireRole('super_admin'), async (_req, res: Response) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return res.json(coupons);
});

router.post('/', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.create({ ...req.body, code: req.body.code?.toUpperCase() });
    return res.status(201).json(coupon);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) return res.status(404).json({ error: 'Not found' });
  return res.json(coupon);
});

router.delete('/:id', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  await Coupon.findByIdAndDelete(req.params.id);
  return res.json({ success: true });
});

export default router;
