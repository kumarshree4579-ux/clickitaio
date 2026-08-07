import jwt, { SignOptions } from 'jsonwebtoken';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export function signAccessToken(payload: object) {
  const opts: SignOptions = { expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as SignOptions['expiresIn'] };
  return jwt.sign(payload, requireEnv('JWT_SECRET'), opts);
}

export function signRefreshToken(payload: object) {
  const opts: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as SignOptions['expiresIn'] };
  return jwt.sign(payload, requireEnv('JWT_REFRESH_SECRET'), opts);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, requireEnv('JWT_SECRET'));
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, requireEnv('JWT_REFRESH_SECRET'));
}
