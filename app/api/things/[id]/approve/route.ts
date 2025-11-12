import { NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { verifyAuth } from '@/server/auth';

export async function POST(req: Request, ctx: any) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const id = String(ctx?.params?.id || '');
  const body = await req.json().catch(() => ({}));
  const viewerUserId = String(body.viewerUserId || '');
  if (!id || !viewerUserId) return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
  const thing = await prisma.thing.findUnique({ where: { id } });
  if (!thing) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (thing.ownerId !== auth.userId) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const rec = await prisma.thingAccessApproval.upsert({
    where: { thingId_viewerId: { thingId: id, viewerId: viewerUserId } },
    update: { approvedAt: new Date() },
    create: { thingId: id, viewerId: viewerUserId },
  });
  return NextResponse.json({ approval: rec }, { status: 201 });
}

