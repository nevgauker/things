import jwt from 'jsonwebtoken';

export type AuthUser = {
  userId: string;
  email?: string;
};

export function getAuthToken(req: Request): string | null {
  const hdr = req.headers.get('authorization') || req.headers.get('Authorization');
  if (hdr && hdr.startsWith('Bearer ')) return hdr.slice(7).trim();
  const cookie = req.headers.get('cookie') || '';
  const m = /(?:^|;\s*)auth_token=([^;]+)/.exec(cookie);
  return m ? decodeURIComponent(m[1]) : null;
}

export function verifyAuth(req: Request): AuthUser | null {
  const token = getAuthToken(req);
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set');
    const decoded = jwt.verify(token, secret) as any;
    const userId = String(decoded.userId || decoded.id || decoded.sub || '');
    if (!userId) return null;
    return { userId, email: decoded.email };
  } catch {
    return null;
  }
}
