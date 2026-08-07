import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { OTP } from '../models/otp';
import { User } from '../models/user';
import { sendOtpEmail } from '../utils/mailer';
import { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } from '../utils/jwt';
import { sanitizeLog } from '../utils/sanitize';
import { validate, LoginSchema, OtpRequestSchema, OtpVerifySchema } from '../utils/validation';

const router = Router();
const OTP_TTL = 10 * 60 * 1000;

const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Too many OTP requests. Try again in 15 minutes.' }, standardHeaders: true, legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts. Try again in 15 minutes.' }, standardHeaders: true, legacyHeaders: false });

// POST /auth/request-otp
router.post('/request-otp', otpLimiter, validate(OtpRequestSchema), async (req: Request, res: Response) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  await OTP.create({ email: normalizedEmail, hashedOtp, expiresAt: new Date(Date.now() + OTP_TTL), used: false });
  await sendOtpEmail(normalizedEmail, otp);
  console.log(`OTP requested for: ${sanitizeLog(normalizedEmail)}`);
  return res.json({ success: true });
});

// POST /auth/verify-otp
router.post('/verify-otp', otpLimiter, validate(OtpVerifySchema), async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const record = await OTP.findOne({ email: normalizedEmail, used: false, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  if (!record) return res.status(400).json({ error: 'OTP expired or not found' });
  const match = await bcrypt.compare(String(otp), record.hashedOtp);
  if (!match) return res.status(400).json({ error: 'Invalid OTP' });
  record.used = true;
  await record.save();
  let user = await User.findOne({ email: normalizedEmail });
  if (!user) user = await User.create({ email: normalizedEmail });
  const accessToken = signAccessToken({ sub: user._id.toString(), email: user.email });
  const refreshToken = signRefreshToken({ sub: user._id.toString() });
  return res.json({ accessToken, refreshToken, user: { id: user._id, email: user.email, role: user.role } });
});

// POST /auth/login
router.post('/login', loginLimiter, validate(LoginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail, isActive: true });
  if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(String(password), user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const accessToken = signAccessToken({ sub: user._id.toString(), email: user.email });
  const refreshToken = signRefreshToken({ sub: user._id.toString() });
  return res.json({ accessToken, refreshToken, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
});

// POST /auth/refresh — exchange refresh token for new access token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
  try {
    const payload = verifyRefreshToken(refreshToken) as any;
    const user = await User.findById(payload.sub).select('email role isActive');
    if (!user || !user.isActive) return res.status(401).json({ error: 'User not found or inactive' });
    const accessToken = signAccessToken({ sub: user._id.toString(), email: user.email });
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /auth/me — get current user from token
router.get('/me', async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyAccessToken(header.slice(7)) as any;
    const user = await User.findById(payload.sub).select('name email role isActive');
    if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' });
    return res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// GET /auth/customers — admin only
router.get('/customers', async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { verifyAccessToken: vat } = await import('../utils/jwt');
    const payload = vat(header.slice(7)) as any;
    const admin = await User.findById(payload.sub).select('role isActive');
    if (!admin || !admin.isActive || admin.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { page = '1', limit = '20', q } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter: any = { role: 'customer' };
    if (q) filter.$or = [{ email: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } }];
    const [items, total] = await Promise.all([
      User.find(filter).select('name email isActive createdAt').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);
    return res.json({ items, total });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
