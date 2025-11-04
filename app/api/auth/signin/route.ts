import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from '@/server/rateLimit';
import { z } from 'zod';
import { prisma } from '@/server/prisma';

export async function POST(req: NextRequest) {
  // Basic IP-based rate limit: 10 req/5min
  const limited = rateLimit(req, { key: 'auth:signin', max: 10, windowMs: 5 * 60_000 });
  if (!limited.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const schema = z.object({ email: z.string().email(), password: z.string().min(6).max(100) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  const secret = process.env.JWT_SECRET;
  if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  const token = jwt.sign(
    { email: user.email, userId: String(user.id) },
    secret,
    { expiresIn: '24h' }
  );

  const res = NextResponse.json({ message: 'Auth successful', token, user, newUser: false });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
    secure: isProd,
  });
  return res;
}
