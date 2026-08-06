import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { OTP } from '../models/otp';
import { User } from '../models/user';
import { sendOtpEmail } from '../utils/mailer';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { sanitizeLog } from '../utils/sanitize';

const router = Router();
const OTP_TTL = 10 * 60 * 1000;

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /auth/request-otp
router.post('/request-otp', otpLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Valid email required' });
  const normalizedEmail = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  await OTP.create({ email: normalizedEmail, hashedOtp, expiresAt: new Date(Date.now() + OTP_TTL), used: false });
  await sendOtpEmail(normalizedEmail, otp);
  console.log(`OTP requested for: ${sanitizeLog(normalizedEmail)}`);
  return res.json({ success: true });
});

// POST /auth/verify-otp
router.post('/verify-otp', otpLimiter, async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
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
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail, isActive: true });
  if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(String(password), user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const accessToken = signAccessToken({ sub: user._id.toString(), email: user.email });
  const refreshToken = signRefreshToken({ sub: user._id.toString() });
  return res.json({ accessToken, refreshToken, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
});

export default router;
