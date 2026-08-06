import { Router, Response } from 'express';
import { Product } from '../models/product';
import { StockMovement } from '../models/stockMovement';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';

const router = Router();

// GET /inventory — all products with stock info
router.get('/', requireAuth, requireRole('super_admin', 'inventory_staff', 'order_manager'), async (_req, res: Response) => {
  const products = await Product.find({}, 'name sku stock minStock status').sort({ stock: 1 });
  return res.json(products);
});

// GET /inventory/low-stock
router.get('/low-stock', requireAuth, requireRole('super_admin', 'inventory_staff', 'order_manager'), async (_req, res: Response) => {
  const products = await Product.find({ $expr: { $lte: ['$stock', '$minStock'] } }, 'name sku stock minStock').sort({ stock: 1 });
  return res.json(products);
});

// GET /inventory/:productId/movements
router.get('/:productId/movements', requireAuth, requireRole('super_admin', 'inventory_staff'), async (req, res: Response) => {
  const movements = await StockMovement.find({ product: req.params.productId })
    .sort({ createdAt: -1 }).limit(50).populate('createdBy', 'name email');
  return res.json(movements);
});

// POST /inventory/:productId/adjust — manual stock adjustment
router.post('/:productId/adjust', requireAuth, requireRole('super_admin', 'inventory_staff'), async (req: AuthedRequest, res: Response) => {
  try {
    const { qty, note, type = 'adjustment' } = req.body;
    if (qty == null) return res.status(400).json({ error: 'qty is required' });

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const before = product.stock;
    const after = before + Number(qty);
    if (after < 0) return res.status(400).json({ error: 'Stock cannot go below 0' });

    product.stock = after;
    await product.save();

    await StockMovement.create({
      product: product._id,
      type,
      qty: Number(qty),
      before,
      after,
      note,
      createdBy: req.user!.sub,
    });

    return res.json({ product, movement: { before, after, qty } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
