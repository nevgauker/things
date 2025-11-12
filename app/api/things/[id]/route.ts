import { NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { uploadImageFromFormData } from '@/server/upload';
import { cloudinary } from '@/server/cloudinary';
import { verifyAuth } from '@/server/auth';
import { z } from '@/server/validate';
import { rateLimit } from '@/server/rateLimit';

// Compute an obfuscated/approximate center from precise coordinates
function approximateCenter(lat?: number | null, lng?: number | null, radiusKm = 2) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  // Round to ~1km grid by 2 decimals (~1.1km at equator). Keep radius to hint the area.
  const round = (n: number, d = 2) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
  return { center: { lat: round(lat, 2), lng: round(lng, 2) }, radiusKm } as const;
}

type PrivacyConfig = { visibility: 'public_km' | 'verified_only' | 'hidden_until_contact'; radiusKm: number };
function privacyFromThing(t: any): PrivacyConfig {
  const fallback: PrivacyConfig = { visibility: 'public_km', radiusKm: 2 };
  try {
    const cfg = (t?.googleData?.privacy as PrivacyConfig) || fallback;
    return {
      visibility: (cfg.visibility as any) || 'public_km',
      radiusKm: typeof cfg.radiusKm === 'number' && cfg.radiusKm > 0 ? cfg.radiusKm : 2,
    };
  } catch {
    return fallback;
  }
}

export async function GET(req: Request, context: any) {
  const auth = verifyAuth(req);
  const thing = await prisma.thing.findUnique({
    where: { id: String(context?.params?.id || '') },
    include: { owner: { select: { id: true, name: true, userAvatar: true } } },
  });
  if (!thing) return NextResponse.json({ error: 'Could not fetch thing' }, { status: 404 });

  const privacy = privacyFromThing(thing);
  const isOwner = !!(auth?.userId && thing.ownerId && auth.userId === thing.ownerId);
  const PRIVACY_DISABLED =
    process.env.NEXT_PUBLIC_DISABLE_PRIVACY === 'true' ||
    process.env.NEXT_PUBLIC_DISABLE_PRIVACY === '1';
  // Exact coordinates allowed if owner or approved viewer; otherwise serve approximate.
  let approved = false;
  if (auth?.userId && !isOwner) {
    try {
      const a = await prisma.thingAccessApproval.findUnique({
        where: { thingId_viewerId: { thingId: String(context?.params?.id || ''), viewerId: auth.userId } },
      });
      approved = !!a;
    } catch {}
  }
  const allowExact = isOwner || approved;
  const allowApprox = true; // always allow approximate for all viewers

  const approx = allowApprox ? approximateCenter((thing as any).latitude, (thing as any).longitude, privacy.radiusKm) : null;

  // Build a privacy-safe payload. Do not include exact lat/lng or owner private data.
  const safe: any = {
    id: thing.id,
    name: thing.name,
    images: Array.isArray((thing as any).images) && (thing as any).images.length
      ? (thing as any).images
      : ((thing as any).imageUrl ? [(thing as any).imageUrl] : []),
    type: thing.type,
    category: thing.category,
    price: thing.price,
    currencyCode: thing.currencyCode,
    priceRange: thing.priceRange,
    city: thing.city,
    country: thing.country,
    status: thing.status,
    start: thing.start,
    end: thing.end,
    ownerImageUrl: (thing as any).ownerImageUrl,
    ownerId: thing.ownerId,
    owner: thing.owner ? { id: thing.owner.id, name: thing.owner.name, userAvatar: thing.owner.userAvatar } : null,
    fromGoogle: thing.fromGoogle,
    googleData: undefined, // strip google raw data by default
    approximateCenter: approx?.center || null,
    approximateRadiusKm: approx?.radiusKm || null,
    visibility: privacy.visibility,
    canNavigate: allowExact,
    exactCenter: allowExact && typeof (thing as any).latitude === 'number' && typeof (thing as any).longitude === 'number'
      ? { lat: (thing as any).latitude as number, lng: (thing as any).longitude as number }
      : null,
  };

  // If owner is viewing, they can see their own Google metadata for management purposes (still omit precise coords here)
  if (isOwner) safe.googleData = (thing as any).googleData || undefined;

  return NextResponse.json({ thing: safe, message: 'Fetching thing successful' });
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

  // Optional privacy settings stored inside googleData. This avoids schema migrations.
  const visibility = form.get('visibility');
  const visibilityRadiusKm = form.get('visibilityRadiusKm');
  if (visibility || visibilityRadiusKm) {
    const currentPrivacy = ((data.googleData as any)?.privacy) || {};
    const next: any = { ...currentPrivacy };
    if (typeof visibility === 'string') next.visibility = visibility;
    if (typeof visibilityRadiusKm === 'string') {
      const n = Number(visibilityRadiusKm);
      if (Number.isFinite(n) && n > 0) next.radiusKm = n;
    }
    (data as any).googleData = { ...((data as any).googleData || {}), privacy: next };
  }

  let uploads: string[] = [];
  try {
    const collected: string[] = [];
    const entries: [string, any][] = [];
    try {
      // @ts-ignore - runtime FormData
      for (const pair of (form as any).entries()) entries.push(pair as [string, any]);
    } catch {}
    const keys = new Set<string>();
    for (const [k, v] of entries) {
      if (k.startsWith('thingImage') && typeof v !== 'string') keys.add(k);
    }
    if (keys.size === 0) {
      const up = await uploadImageFromFormData(form as unknown as FormData, 'thingImage', process.env.DEVELOPMENT_THINGS_IMAGES_PATH);
      if (up) collected.push(up);
    } else {
      for (const k of keys) {
        try {
          const up = await uploadImageFromFormData(form as unknown as FormData, k, process.env.DEVELOPMENT_THINGS_IMAGES_PATH);
          if (up) collected.push(up);
        } catch {}
      }
    }
    uploads = collected;
  } catch (_) {}

  // Allow client to set/override images order via JSON (existing images), append uploads
  const imagesJson = form.get('imagesJson');
  if (imagesJson && typeof imagesJson === 'string') {
    try {
      const base: string[] = JSON.parse(imagesJson);
      const finalArr = Array.isArray(base) ? base.slice() : [];
      if (uploads.length) finalArr.push(...uploads);
      if (finalArr.length) {
        (data as any).images = finalArr as any;
        (data as any).imageUrl = finalArr[0];
      }
    } catch {}
  } else if (uploads.length) {
    (data as any).images = uploads as any;
    (data as any).imageUrl = uploads[0];
  }

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
    // Accept privacy inputs (validated loosely; stored within googleData)
    visibility: z.string().optional(),
    visibilityRadiusKm: z.number().positive().optional(),
  });
  const parsed = schema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ message: 'Invalid input' }, { status: 400 });

  // enforce ownership
  const id = String(context?.params?.id || '');
  const current = await prisma.thing.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (current.ownerId !== auth.userId) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  // Cap images to 5
  if (Array.isArray((data as any).images)) {
    (data as any).images = (data as any).images.slice(0, 5);
    (data as any).imageUrl = (data as any).images[0] || (data as any).imageUrl || null;
  }

  // Best-effort cleanup of removed images from Cloudinary
  try {
    const prevImages: string[] = Array.isArray((current as any).images)
      ? ((current as any).images as any[]).filter(Boolean)
      : (current.imageUrl ? [current.imageUrl] : []);
    const nextImages: string[] = Array.isArray((data as any).images)
      ? (data as any).images
      : prevImages;
    const removed = prevImages.filter((u) => !nextImages.includes(u));
    for (const url of removed) {
      const publicId = publicIdFromUrl(url);
      if (publicId) {
        try { await cloudinary.uploader.destroy(publicId); } catch {}
      }
    }
  } catch {}

  const thing = await prisma.thing.update({ where: { id }, data });
  return NextResponse.json({ message: 'Updated thing', thing });
}

function publicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const idx = u.pathname.indexOf('/upload/');
    if (idx === -1) return null;
    let rest = u.pathname.slice(idx + 8); // after /upload/
    const parts = rest.split('/');
    if (parts.length && /^v\d+$/.test(parts[0])) parts.shift();
    let path = parts.join('/');
    path = path.replace(/\.[a-zA-Z0-9]+$/, '');
    return path || null;
  } catch {
    return null;
  }
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
