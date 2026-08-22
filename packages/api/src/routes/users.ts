import { Router, Request, Response } from 'express';
import { User, UserRole } from '../models/user';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

const router = Router();

// Only super_admin can manage staff users
router.use(requireAuth);
router.use(requireRole('super_admin'));

// GET all staff members
router.get('/staff', async (req: AuthedRequest, res: Response) => {
  try {
    const users = await User.find({ role: { $in: ['super_admin', 'order_manager', 'inventory_staff'] } })
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
});

// POST create new staff member
router.post('/staff', async (req: AuthedRequest, res: Response) => {
  try {
    const { name, email, mobile, role, password } = req.body;
    
    if (!['super_admin', 'order_manager', 'inventory_staff'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

    const user = new User({
      name,
      email,
      mobile,
      role,
      passwordHash,
      isActive: true
    });

    await user.save();
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.status(201).json(userObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT update staff member
router.put('/staff/:id', async (req: AuthedRequest, res: Response) => {
  try {
    const { name, email, mobile, role, isActive, password } = req.body;
    
    if (role && !['super_admin', 'order_manager', 'inventory_staff'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updateData: any = { name, email, mobile, role, isActive };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // prevent demoting yourself
    if (req.user?.sub === req.params.id && role && role !== 'super_admin') {
      return res.status(400).json({ error: 'You cannot demote yourself from super_admin' });
    }
    // prevent deactivating yourself
    if (req.user?.sub === req.params.id && isActive === false) {
      return res.status(400).json({ error: 'You cannot deactivate yourself' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE remove staff member
router.delete('/staff/:id', async (req: AuthedRequest, res: Response) => {
  try {
    if (req.user?.sub === req.params.id) {
      return res.status(400).json({ error: 'You cannot delete yourself' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
