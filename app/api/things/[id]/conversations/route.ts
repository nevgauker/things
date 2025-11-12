import { NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { verifyAuth } from '@/server/auth';

export async function GET(req: Request, ctx: any) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const thingId = String(ctx?.params?.id || '');
  if (!thingId) return NextResponse.json({ message: 'Missing thing id' }, { status: 400 });

  const thing = await prisma.thing.findUnique({ where: { id: thingId } });
  if (!thing) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (thing.ownerId !== auth.userId) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const convs = await prisma.conversation.findMany({
    where: {
      thingId,
      participants: { some: { userId: auth.userId } },
    },
    include: {
      participants: { include: { user: { select: { id: true, name: true, userAvatar: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });
  const list = convs.map((c) => {
    const other = c.participants.find((p) => p.userId !== auth.userId)?.user;
    const last = c.messages[0] || null;
    return {
      id: c.id,
      otherUser: other || null,
      lastMessage: last ? { text: last.text, createdAt: last.createdAt } : null,
    };
  });
  return NextResponse.json({ conversations: list });
}

