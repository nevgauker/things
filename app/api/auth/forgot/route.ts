import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { rateLimit } from '@/server/rateLimit';
import { z } from '@/server/validate';

function randomToken(bytes = 32) {
  // Use Node crypto without import types to avoid bundling issues
  // eslint-disable-next-line no-eval
  const dynamicRequire: NodeRequire = eval('require');
  const crypto = dynamicRequire('crypto');
  return crypto.randomBytes(bytes).toString('base64url');
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: 'auth:forgot', max: 5, windowMs: 10 * 60_000 });
  if (!limited.ok) return NextResponse.json({ message: 'If the email exists, a reset link will be sent.' });

  const body = await req.json().catch(() => ({}));
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: 'If the email exists, a reset link will be sent.' });
  const { email } = parsed.data as { email: string };

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = randomToken(32);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await (prisma as any).passwordReset.create({ data: { userId: user.id, token, expiresAt } });
      const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || '';
      const origin = base ? (base.startsWith('http') ? base : `https://${base}`) : undefined;
      const url = `${origin || ''}/reset-password/${encodeURIComponent(token)}`;
      // TODO: integrate email provider; for now we expose the link for development purposes only
      return NextResponse.json({ message: 'If the email exists, a reset link will be sent.', devLink: url });
    }
  } catch {}
  return NextResponse.json({ message: 'If the email exists, a reset link will be sent.' });
}
