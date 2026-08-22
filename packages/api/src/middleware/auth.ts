import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User, UserRole } from '../models/user';

export interface AuthedRequest extends Request {
  user?: { sub: string; email: string; role: UserRole };
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  let token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token && req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyAccessToken(token) as any;
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
