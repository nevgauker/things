import { NextResponse } from 'next/server';
import { verifyAuth } from '@/server/auth';
import { prisma } from '@/server/prisma';

export async function GET(req: Request) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
  return NextResponse.json({ user });
}

