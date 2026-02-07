type EventProps = Record<string, unknown>;

export function track(event: string, props: EventProps = {}) {
  if (typeof window === 'undefined') return;
  try {
    const payload = { event, ...props, ts: Date.now() };
    // Hook for analytics providers (Segment, GA, etc.)
    (window as any).dataLayer?.push?.(payload);
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[analytics]', payload);
    }
  } catch {
    // no-op
  }
}
