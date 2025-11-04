import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/server/prisma';
import { rateLimit } from '@/server/rateLimit';
import { z } from '@/server/validate';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: 'auth:reset', max: 10, windowMs: 10 * 60_000 });
  if (!limited.ok) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const schema = z.object({ token: z.string().min(10), password: z.string().min(6).max(100) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
  const { token, password } = parsed.data as { token: string; password: string };

  const rec = await (prisma as any).passwordReset.findUnique({ where: { token } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
    return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
  }
  const hash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: rec.userId }, data: { password: hash } }),
    (prisma as any).passwordReset.update({ where: { token }, data: { usedAt: new Date() } }),
  ]);
  const res = NextResponse.json({ message: 'Password updated' });
  // Clear auth cookie if present
  res.cookies.set('auth_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  return res;
}
