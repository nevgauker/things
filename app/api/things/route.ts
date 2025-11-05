import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { uploadImageFromFormData } from '@/server/upload';
import { verifyAuth } from '@/server/auth';
import { z } from '@/server/validate';
import { rateLimit } from '@/server/rateLimit';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get('ownerId') || undefined;
  const search = searchParams.get('search') || undefined;
  const categoryParam = searchParams.get('category') || undefined;
  const type = searchParams.get('type') || undefined;
  const status = searchParams.get('status') || undefined;
  const neLat = parseFloat(searchParams.get('neLat') || '');
  const neLng = parseFloat(searchParams.get('neLng') || '');
  const swLat = parseFloat(searchParams.get('swLat') || '');
  const swLng = parseFloat(searchParams.get('swLng') || '');

  const where: any = {};
  if (ownerId) where.ownerId = ownerId;
  if (type) where.type = type;
  if (status) where.status = status;
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (categoryParam) {
    const categories = String(categoryParam).split(',').map((s) => s.trim()).filter(Boolean);
    if (categories.length > 0) {
      where.OR = categories.map((c) => ({ category: { contains: c, mode: 'insensitive' } }));
    }
  }
  if ([neLat, neLng, swLat, swLng].every((n) => !Number.isNaN(n))) {
    where.AND = [
      { latitude: { gte: swLat } },
      { latitude: { lte: neLat } },
      { longitude: { gte: swLng } },
      { longitude: { lte: neLng } },
    ];
  }

  const things = await prisma.thing.findMany({ where, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ things, message: 'Fetching things successful' });
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req as unknown as Request);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // Rate limit writes: 20 req/10min per IP
  const limited = rateLimit(req, { key: 'things:create', max: 20, windowMs: 10 * 60_000 });
  if (!limited.ok) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  const form = await req.formData();
  const name = form.get('name') as string | null;
  // Ignore ownerId/ownerImageUrl from client; derive from token/user
  const category = form.get('category') as string | null;
  const type = form.get('type') as string | null;
  const price = form.get('price') as string | null;
  const currencyCode = form.get('currencyCode') as string | null;
  const latitude = form.get('latitude') as string | null;
  const longitude = form.get('longitude') as string | null;
  const country = form.get('country') as string | null;
  const city = form.get('city') as string | null;
  const start = form.get('start') as string | null;
  const end = form.get('end') as string | null;
  const priceRange = form.get('priceRange') as string | null;

  const schema = z.object({
    name: z.string().min(1).max(200),
    type: z.enum(['thing', 'store', 'event']),
    latitude: z.coerce.number().gte(-90).lte(90),
    longitude: z.coerce.number().gte(-180).lte(180),
    category: z.string().max(40).optional(),
    price: z.coerce.number().nonnegative().optional(),
    currencyCode: z.string().length(3).optional(),
    country: z.string().max(60).optional(),
    city: z.string().max(60).optional(),
    start: z.string().optional().nullable(),
    end: z.string().optional().nullable(),
    priceRange: z.coerce.number().nonnegative().optional(),
  });
  const parsed = schema.safeParse({ name, type, latitude, longitude, category, price, currencyCode, country, city, start, end, priceRange });
  if (!parsed.success) {
    try {
      const issues: any[] = (parsed as any).error?.issues || [];
      const details = issues.map((i) => ({
        path: Array.isArray(i.path) ? i.path.join('.') : String(i.path ?? ''),
        message: i.message,
        expected: i.expected,
        received: i.received,
      }));
      console.error('[POST /api/things] Validation failed', { details });
    } catch (e) {
      console.error('[POST /api/things] Validation failed (could not format error)');
    }
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
  }

  let imageUrl: string | undefined = undefined;
  try {
    const uploaded = await uploadImageFromFormData(form as unknown as FormData, 'thingImage', process.env.DEVELOPMENT_THINGS_IMAGES_PATH);
    if (uploaded) imageUrl = uploaded;
  } catch (_) { }

  // Optionally fetch user to set owner avatar
  let ownerImageUrl: string | undefined = undefined;
  try {
    const owner = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (owner?.userAvatar) ownerImageUrl = owner.userAvatar;
  } catch { }

  const createData: any = {
    name,
    ownerId: auth.userId,
    ownerImageUrl: ownerImageUrl ?? undefined,
    imageUrl,
    type: type ?? undefined,
    category: category ?? undefined,
    latitude: latitude ? Number(latitude) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
    city: city ?? undefined,
    country: country ?? undefined,
    status: 'available',
    start: type === 'event' ? start ?? undefined : undefined,
    end: type === 'event' ? end ?? undefined : undefined,
    priceRange: type === 'store' ? (priceRange ? Number(priceRange) : undefined) : undefined,
    price: type !== 'store' ? (price ? Number(price) : undefined) : undefined,
    currencyCode: type !== 'store' ? (currencyCode ? String(currencyCode).toUpperCase() : undefined) : undefined,
    fromGoogle: false,
  };
  const thing = await prisma.thing.create({ data: createData });

  return NextResponse.json({ thing }, { status: 201 });
}
