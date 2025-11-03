import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
  const form = await req.formData();
  const name = (form.get('name') as string) || '';
  const email = (form.get('email') as string) || '';
  const password = (form.get('password') as string) || '';
  const preferredCurrency = (form.get('preferredCurrency') as string) || '$';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

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

  const token = jwt.sign({ email: user.email, userId: String(user.id) }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
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

