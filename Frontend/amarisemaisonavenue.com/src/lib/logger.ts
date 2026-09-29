import * as Sentry from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

// Structured logging for production-relevant code paths (data fetching, auth, checkout) —
// NOT for the storefront's decorative demo/mock subsystems (observability/engine.ts,
// notifications/mock-engine.ts, etc.), which intentionally simulate an ops dashboard and
// should not be dressed up as real logging. `error` also reports to Sentry (a no-op until
// NEXT_PUBLIC_SENTRY_DSN/SENTRY_DSN is configured — see instrumentation.ts / instrumentation-client.ts).
function emit(level: LogLevel, scope: string, message: string, context?: LogContext) {
  const payload = { level, scope, message, ...context, timestamp: new Date().toISOString() };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (scope: string, message: string, context?: LogContext) => {
    if (process.env.NODE_ENV !== 'production') emit('debug', scope, message, context);
  },
  info: (scope: string, message: string, context?: LogContext) => emit('info', scope, message, context),
  warn: (scope: string, message: string, context?: LogContext) => emit('warn', scope, message, context),
  error: (scope: string, message: string, error?: unknown, context?: LogContext) => {
    emit('error', scope, message, { ...context, error: error instanceof Error ? error.message : error });
    if (error instanceof Error) Sentry.captureException(error, { tags: { scope } });
    else Sentry.captureMessage(`${scope}: ${message}`, 'error');
  },
};
