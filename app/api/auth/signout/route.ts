import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'Signed out' });
  res.cookies.set('auth_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

