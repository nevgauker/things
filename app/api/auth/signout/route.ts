import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const res = NextResponse.json({ message: 'Signed out' });
  const isProd = process.env.NODE_ENV === 'production';
  const reqOrigin = req.headers.get('origin') || '';
  const selfOrigin = new URL(req.url).origin;
  const crossSite = !!reqOrigin && reqOrigin !== selfOrigin;
  res.cookies.set('auth_token', '', {
    httpOnly: true,
    sameSite: crossSite ? 'none' : 'lax',
    path: '/',
    maxAge: 0,
    secure: isProd || crossSite,
  });
  return res;
}
