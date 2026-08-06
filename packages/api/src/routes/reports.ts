import { Router, Response } from 'express';
import { Order } from '../models/order';
import { Product } from '../models/product';
import { User } from '../models/user';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// GET /reports/summary
router.get('/summary', requireAuth, requireRole('super_admin', 'order_manager'), async (_req, res: Response) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todayOrders, todaySales,
    monthOrders, monthSales,
    totalOrders, pendingOrders, deliveredOrders, cancelledOrders,
    totalProducts, outOfStock, lowStock,
    totalCustomers,
  ] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: todayStart }, status: { $ne: 'cancelled' } }),
    Order.aggregate([{ $match: { createdAt: { $gte: todayStart }, paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.countDocuments({ createdAt: { $gte: monthStart }, status: { $ne: 'cancelled' } }),
    Order.aggregate([{ $match: { createdAt: { $gte: monthStart }, paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: 'delivered' }),
    Order.countDocuments({ status: 'cancelled' }),
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({ stock: 0 }),
    Product.countDocuments({ $expr: { $and: [{ $gt: ['$minStock', 0] }, { $lte: ['$stock', '$minStock'] }] } }),
    User.countDocuments({ role: 'customer' }),
  ]);

  return res.json({
    today: { orders: todayOrders, sales: todaySales[0]?.total || 0 },
    month: { orders: monthOrders, sales: monthSales[0]?.total || 0 },
    orders: { total: totalOrders, pending: pendingOrders, delivered: deliveredOrders, cancelled: cancelledOrders },
    products: { total: totalProducts, outOfStock, lowStock },
    customers: totalCustomers,
  });
});

// GET /reports/sales?days=30
router.get('/sales', requireAuth, requireRole('super_admin', 'order_manager'), async (req, res: Response) => {
  const days = parseInt((req.query.days as string) || '30');
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: from }, paymentStatus: 'paid' } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      revenue: { $sum: '$total' },
      orders: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]);

  return res.json(data);
});

// GET /reports/top-products?limit=10
router.get('/top-products', requireAuth, requireRole('super_admin', 'order_manager'), async (req, res: Response) => {
  const limit = parseInt((req.query.limit as string) || '10');

  const data = await Order.aggregate([
    { $match: { status: { $nin: ['cancelled', 'returned'] } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', name: { $first: '$items.name' }, totalQty: { $sum: '$items.qty' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } },
    { $sort: { totalQty: -1 } },
    { $limit: limit },
  ]);

  return res.json(data);
});

export default router;
