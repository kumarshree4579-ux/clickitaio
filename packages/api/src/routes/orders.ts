import { Router, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Order } from '../models/order';
import { Product } from '../models/product';
import { StockMovement } from '../models/stockMovement';
import { User } from '../models/user';
import { Coupon } from '../models/coupon';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '../utils/mailer';
import { validate, OrderSchema } from '../utils/validation';

const router = Router();

function genOrderNumber() {
  return 'ORD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

function getRazorpay() {
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || '', key_secret: process.env.RAZORPAY_KEY_SECRET || '' });
}

router.post('/', requireAuth, validate(OrderSchema), async (req: AuthedRequest, res: Response) => {
  try {
    const { items, address, paymentMethod, couponCode, notes } = req.body;

    const orderItems = [];
    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item._id);
      if (!product) return res.status(400).json({ error: `Product ${item._id} not found` });
      if (product.stock < item.qty) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      orderItems.push({ product: product._id, name: product.name, sku: product.sku, image: product.images[0]?.url, price: product.sellingPrice, mrp: product.mrp, qty: item.qty });
      subtotal += product.sellingPrice * item.qty;
    }

    const shippingCharge = subtotal >= 500 ? 0 : 49;
    let discount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date()) && (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)) {
        if (coupon.type === 'flat') discount = coupon.value;
        else if (coupon.type === 'percentage') {
          discount = Math.round((subtotal * coupon.value) / 100);
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else if (coupon.type === 'free_shipping') discount = shippingCharge;
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
    }

    const total = subtotal + shippingCharge - discount;

    const order = await Order.create({
      orderNumber: genOrderNumber(), customer: req.user!.sub, items: orderItems, address,
      subtotal, shippingCharge, discount, total, couponCode, paymentMethod,
      paymentStatus: 'pending', status: 'pending', notes,
      statusHistory: [{ status: 'pending', at: new Date() }],
    });

    // For COD: deduct stock immediately. For Razorpay: deduct only after payment verified.
    if (paymentMethod === 'cod') {
      for (const item of items) {
        const prod = await Product.findById(item._id);
        if (prod) {
          const before = prod.stock;
          const after = before - item.qty;
          await Product.findByIdAndUpdate(item._id, { stock: after });
          await StockMovement.create({ product: item._id, type: 'sale', qty: -item.qty, before, after, reference: order.orderNumber, createdBy: req.user!.sub });
        }
      }
    }

    const user = await User.findById(req.user!.sub);
    if (user?.email) sendOrderConfirmationEmail(user.email, order).catch(() => {});

    if (paymentMethod === 'razorpay') {
      const rpOrder = await getRazorpay().orders.create({ amount: total * 100, currency: 'INR', receipt: order.orderNumber });
      await Order.findByIdAndUpdate(order._id, { razorpayOrderId: rpOrder.id });
      return res.status(201).json({ order, razorpayOrderId: rpOrder.id, razorpayKeyId: process.env.RAZORPAY_KEY_ID });
    }

    return res.status(201).json({ order });
  } catch (err: any) {
    console.error('create order error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/verify-payment', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const expectedSig = crypto.createHmac('sha256', secret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
    if (expectedSig !== razorpaySignature) return res.status(400).json({ error: 'Invalid payment signature' });
    const order = await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid', status: 'confirmed', razorpayPaymentId,
      $push: { statusHistory: { status: 'confirmed', at: new Date(), note: 'Payment received' } },
    }, { new: true }).populate('customer', 'email');
    // Deduct stock now that payment is confirmed
    const pendingOrder = await Order.findById(orderId);
    if (pendingOrder) {
      for (const item of pendingOrder.items) {
        const prod = await Product.findById(item.product);
        if (prod) {
          const before = prod.stock;
          const after = Math.max(0, before - item.qty);
          await Product.findByIdAndUpdate(item.product, { stock: after });
          await StockMovement.create({ product: item.product, type: 'sale', qty: -item.qty, before, after, reference: pendingOrder.orderNumber, createdBy: pendingOrder.customer });
        }
      }
    }
    const customer = order?.customer as any;
    if (customer?.email) sendOrderStatusEmail(customer.email, order!.orderNumber, 'confirmed').catch(() => {});
    return res.json({ success: true, order });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { page = '1', limit = '10' } = req.query as any;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter: any = {};
  if (!['super_admin', 'order_manager'].includes(req.user!.role)) filter.customer = req.user!.sub;
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('customer', 'name email'),
    Order.countDocuments(filter),
  ]);
  return res.json({ items, total });
});

router.get('/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  const order = await Order.findById(req.params.id).populate('customer', 'name email').populate('items.product', 'name slug');
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (!['super_admin', 'order_manager'].includes(req.user!.role) && order.customer.toString() !== req.user!.sub) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return res.json(order);
});

router.put('/:id/status', requireAuth, requireRole('super_admin', 'order_manager'), async (req: AuthedRequest, res: Response) => {
  const { status, note } = req.body;
  const validStatuses = ['pending','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','returned','refunded'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const order = await Order.findByIdAndUpdate(req.params.id, {
    status, $push: { statusHistory: { status, at: new Date(), note } },
  }, { new: true }).populate('customer', 'email');
  if (!order) return res.status(404).json({ error: 'Not found' });
  const customer = order.customer as any;
  if (customer?.email) sendOrderStatusEmail(customer.email, order.orderNumber, status).catch(() => {});
  return res.json(order);
});

router.put('/:id/cancel', requireAuth, async (req: AuthedRequest, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (order.customer.toString() !== req.user!.sub) return res.status(403).json({ error: 'Forbidden' });
  if (!['pending', 'confirmed'].includes(order.status)) return res.status(400).json({ error: 'Cannot cancel at this stage' });
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
  }
  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', at: new Date() });
  await order.save();
  return res.json(order);
});

export default router;
