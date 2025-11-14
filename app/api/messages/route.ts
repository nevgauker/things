import { NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { verifyAuth } from '@/server/auth';

export async function GET(req: Request) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const thingId = searchParams.get('thingId') || '';
  const withUserId = searchParams.get('withUserId') || '';
  if (!thingId || !withUserId) return NextResponse.json({ message: 'Missing params' }, { status: 400 });
  const conv = await prisma.conversation.findFirst({
    where: {
      thingId,
      participants: {
        some: { userId: auth.userId },
      },
      AND: {
        participants: {
          some: { userId: withUserId },
        },
      },
    },
  });
  if (!conv) return NextResponse.json({ messages: [], conversation: null });
  const messages = await prisma.message.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ messages, conversation: conv });
}

export async function POST(req: Request) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const thingId = String(body.thingId || '');
  const toUserId = String(body.toUserId || '');
  const text = String(body.text || '').trim();
  if (!thingId || !toUserId || !text) return NextResponse.json({ message: 'Invalid input' }, { status: 400 });

  // ensure thing exists
  const thing = await prisma.thing.findUnique({ where: { id: thingId } });
  if (!thing) return NextResponse.json({ message: 'Thing not found' }, { status: 404 });
  // find conversation with exactly these two participants (or create)
  let conv = await prisma.conversation.findFirst({
    where: {
      thingId,
      participants: { some: { userId: auth.userId } },
      AND: { participants: { some: { userId: toUserId } } },
    },
    include: { participants: true },
  });
  if (!conv || conv.participants.length !== 2) {
    conv = await prisma.conversation.create({ data: { thingId }, include: { participants: true } });
    await prisma.conversationParticipant.createMany({
      data: [
        { conversationId: conv.id, userId: auth.userId },
        { conversationId: conv.id, userId: toUserId },
      ],
      skipDuplicates: true,
    });
  }
  const message = await prisma.message.create({ data: { conversationId: conv.id, senderId: auth.userId, text } });
  return NextResponse.json({ message, conversation: conv }, { status: 201 });
}
