type Options = { key?: string; max?: number; windowMs?: number };

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(req: Request, opts: Options = {}) {
  const now = Date.now();
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 60;
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const key = `${opts.key || 'default'}:${ip}`;
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetAt: now + windowMs };
  }
  if (bucket.count >= max) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return { ok: true, remaining: max - bucket.count, resetAt: bucket.resetAt };
}

