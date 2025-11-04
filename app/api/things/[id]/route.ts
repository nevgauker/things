import { NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { uploadImageFromFormData } from '@/server/upload';
import { verifyAuth } from '@/server/auth';
import { z } from 'zod';
import { rateLimit } from '@/server/rateLimit';

export async function GET(_: Request, context: any) {
  const thing = await prisma.thing.findUnique({
    where: { id: String(context?.params?.id || '') },
    include: { owner: { select: { id: true, name: true, email: true, userAvatar: true } } },
  });
  if (!thing) return NextResponse.json({ error: 'Could not fetch thing' }, { status: 404 });
  return NextResponse.json({ thing, message: 'Fetching thing successful' });
}

export async function PATCH(req: Request, context: any) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const limited = rateLimit(req, { key: 'things:update', max: 50, windowMs: 10 * 60_000 });
  if (!limited.ok) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  const form = await req.formData();

  const data: any = {};
  const strFields = ['name','country','city','category','type','status','start','end','currencyCode'] as const;
  strFields.forEach((f) => {
    const v = form.get(f as string);
    if (v !== null) data[f] = v as string;
  });
  const numFields = ['price','priceRange'] as const;
  numFields.forEach((f) => {
    const v = form.get(f as string);
    if (v !== null) data[f] = Number(v);
  });

  const latStr = form.get('latitude');
  const lngStr = form.get('longitude');
  if (latStr && lngStr) {
    data.latitude = Number(latStr);
    data.longitude = Number(lngStr);
  }

  try {
    const img = await uploadImageFromFormData(form as unknown as FormData, 'thingImage', process.env.DEVELOPMENT_THINGS_IMAGES_PATH);
    if (img) data.imageUrl = img;
  } catch (_) {}

  // simple validation for provided fields
  const schema = z.object({
    name: z.string().max(200).optional(),
    country: z.string().max(60).optional(),
    city: z.string().max(60).optional(),
    category: z.string().max(40).optional(),
    type: z.enum(['thing','store','event']).optional(),
    status: z.string().max(40).optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    currencyCode: z.string().length(3).optional(),
    price: z.number().nonnegative().optional(),
    priceRange: z.number().nonnegative().optional(),
    latitude: z.number().gte(-90).lte(90).optional(),
    longitude: z.number().gte(-180).lte(180).optional(),
  });
  const parsed = schema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ message: 'Invalid input' }, { status: 400 });

  // enforce ownership
  const id = String(context?.params?.id || '');
  const current = await prisma.thing.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (current.ownerId !== auth.userId) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const thing = await prisma.thing.update({ where: { id }, data });
  return NextResponse.json({ message: 'Updated thing', thing });
}

export async function DELETE(req: Request, context: any) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const limited = rateLimit(req, { key: 'things:delete', max: 20, windowMs: 10 * 60_000 });
  if (!limited.ok) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  const id = String(context?.params?.id || '');
  const current = await prisma.thing.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (current.ownerId !== auth.userId) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  await prisma.thing.delete({ where: { id } });
  return NextResponse.json({ message: 'Thing was deleted' });
}
