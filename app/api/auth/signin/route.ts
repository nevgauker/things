import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/prisma';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  const token = jwt.sign(
    { email: user.email, userId: String(user.id) },
    process.env.JWT_SECRET || 'secret',
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

