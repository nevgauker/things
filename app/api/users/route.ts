import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { rateLimit } from '@/server/rateLimit';
import { prisma } from '@/server/prisma';
import { uploadImageFromFormData } from '@/server/upload';
import { verifyAuth } from '@/server/auth';

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req as unknown as Request);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const requester = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!requester?.isAdmin) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const items = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items, message: 'Fetching users successful' });
}

export async function POST(req: NextRequest) {
  // Rate limit signups: 5 req/10min per IP
  const limited = rateLimit(req, { key: 'auth:signup', max: 5, windowMs: 10 * 60_000 });
  if (!limited.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const form = await req.formData();
  const toStr = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '');
  const payload = {
    name: toStr(form.get('name')),
    email: toStr(form.get('email')),
    password: toStr(form.get('password')),
    preferredCurrency: toStr(form.get('preferredCurrency')) || '$',
  };
  const schema = z.object({
    name: z.string().max(100).optional(),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    preferredCurrency: z.string().max(3),
  });
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { name, email, password, preferredCurrency } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'Mail exists' }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);

  let userAvatar: string | undefined = undefined;
  try {
    const uploaded = await uploadImageFromFormData(form as unknown as FormData, 'userAvatar', process.env.DEVELOPMENT_USERS_IMAGES_PATH);
    if (uploaded) userAvatar = uploaded;
  } catch (_) {
    // ignore missing file
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      userAvatar,
      isAdmin: false,
      preferredCurrency,
    },
  });

  const secret = process.env.JWT_SECRET;
  if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  const token = jwt.sign({ email: user.email, userId: String(user.id) }, secret, { expiresIn: '24h' });
  const res = NextResponse.json({ message: 'Auth successful', token, user, newUser: true }, { status: 201 });
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
