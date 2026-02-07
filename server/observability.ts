type LogLevel = 'info' | 'warn' | 'error';

function baseLog(level: LogLevel, event: string, data?: Record<string, unknown>) {
  const payload = {
    level,
    event,
    ts: new Date().toISOString(),
    ...data,
  };
  const out = JSON.stringify(payload);
  if (level === 'error') console.error(out);
  else if (level === 'warn') console.warn(out);
  else console.log(out);
}

export function logInfo(event: string, data?: Record<string, unknown>) {
  baseLog('info', event, data);
}

export function logWarn(event: string, data?: Record<string, unknown>) {
  baseLog('warn', event, data);
}

export function logError(event: string, err: unknown, data?: Record<string, unknown>) {
  const details =
    err && typeof err === 'object'
      ? { name: (err as any).name, message: (err as any).message, stack: (err as any).stack }
      : { message: String(err) };
  baseLog('error', event, { error: details, ...data });
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  // Placeholder for Sentry/Datadog/etc.
  logError('error.capture', err, context);
}
