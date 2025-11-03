import { NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { uploadImageFromFormData } from '@/server/upload';
import { verifyAuth } from '@/server/auth';

export async function GET(_: Request, context: any) {
  const user = await prisma.user.findUnique({ where: { id: context?.params?.id } });
  if (!user) return NextResponse.json({ error: 'Could not fetch user' }, { status: 404 });
  return NextResponse.json({ user, message: 'Fetching user successful' });
}

export async function PATCH(req: Request, context: any) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const targetUserId = String(context?.params?.id || '');
  const requester = await prisma.user.findUnique({ where: { id: auth.userId } });
  const isAdmin = requester?.isAdmin === true;
  if (!isAdmin && auth.userId !== targetUserId) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const form = await req.formData();

  const data: any = {};
  const fields = ['name','email','pushToken','phoneNumber','dialCode','isoCode','preferredCurrency'] as const;
  fields.forEach((f) => {
    const v = form.get(f as string);
    if (v !== null) data[f] = v as string;
  });
  ;['sms','whatsapp','telegram'].forEach((f) => {
    const v = form.get(f);
    if (v !== null) (data as any)[f] = v === 'true' || v === '1';
  });

  try {
    const avatar = await uploadImageFromFormData(form as unknown as FormData, 'userAvatar', process.env.DEVELOPMENT_USERS_IMAGES_PATH);
    if (avatar) data.userAvatar = avatar;
  } catch (_) {}

  const user = await prisma.user.update({ where: { id: targetUserId }, data });
  return NextResponse.json({ message: 'Updated user', user });
}

export async function DELETE(req: Request, context: any) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const targetUserId = String(context?.params?.id || '');
  const requester = await prisma.user.findUnique({ where: { id: auth.userId } });
  const isAdmin = requester?.isAdmin === true;
  if (!isAdmin && auth.userId !== targetUserId) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await prisma.user.delete({ where: { id: targetUserId } });
  return NextResponse.json({ message: 'User was deleted' });
}

