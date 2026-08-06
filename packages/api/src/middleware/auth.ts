import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User, UserRole } from '../models/user';

export interface AuthedRequest extends Request {
  user?: { sub: string; email: string; role: UserRole };
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyAccessToken(header.slice(7)) as any;
    const user = await User.findById(payload.sub).select('role isActive');
    if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' });
    req.user = { sub: payload.sub, email: payload.email, role: user.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// backward compat
export const requireAdmin = requireRole('super_admin');
