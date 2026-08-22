import { Router } from 'express';
import { Cart } from '../models/cart';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Sync cart from frontend to backend
// Users might be logged in or guests
router.post('/sync', async (req, res) => {
  try {
    const { guestId, items, totalAmount } = req.body;
    // Assuming auth middleware might set req.user if token is provided, 
    // but this route should be open for both guests and authenticated users.
    // We can conditionally check req.user if auth is applied optionally.
    // But since it's hard to make auth optional cleanly with our current middleware,
    // we'll pass token manually or handle auth inside. 
    // Wait, let's just use a guestId/userId provided in the body for simplicity, 
    // or we can decode token if present.
    // Let's decode token manually if provided in header to get user ID.
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        userId = decoded.id;
      } catch (err) {
        // invalid token, ignore
      }
    }

    if (!userId && !guestId) {
      return res.status(400).json({ error: 'Must provide guestId if not logged in' });
    }

    const query = userId ? { user: userId } : { guestId };
    
    // Upsert the cart
    const cart = await Cart.findOneAndUpdate(
      query,
      {
        user: userId || undefined,
        guestId: guestId || undefined,
        items: items || [],
        totalAmount: totalAmount || 0,
        lastActive: new Date()
      },
      { new: true, upsert: true }
    );

    res.json(cart);
  } catch (error: any) {
    console.error('Cart Sync Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all carts (with pagination and filters)
router.get('/admin', requireAuth, requireRole('super_admin', 'order_manager'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query: any = {};
    
    if (status === 'abandoned') {
      // Considered abandoned if lastActive is older than 2 hours and items.length > 0
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      query.lastActive = { $lte: twoHoursAgo };
      query['items.0'] = { $exists: true }; // has at least one item
    } else if (status === 'active') {
      // Active in the last 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      query.lastActive = { $gt: twoHoursAgo };
    }

    const carts = await Cart.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images mrp sellingPrice')
      .sort({ lastActive: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
      
    const total = await Cart.countDocuments(query);

    res.json({
      carts,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
