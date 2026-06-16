// ── Error tracking (Sentry) + alerting hooks ──────────────────────────────────
//
// Design: this package takes NO Sentry dependency. A service that wants Sentry installs
// @sentry/node itself and registers the instance via registerSentry() (dependency injection),
// so @baalvion/telemetry stays free of Sentry's bundling/lockfile coupling. Both error capture
// and alerting are no-ops until configured, so importing them is always safe.

import { trace, SpanStatusCode } from '@opentelemetry/api';

export interface SentryLike {
  captureException(err: unknown, hint?: unknown): void;
  captureMessage?(msg: string, level?: string): void;
}

let _sentry: SentryLike | null = null;

/**
 * Register a Sentry (or compatible) instance from the host service. Example:
 *   import * as Sentry from '@sentry/node';
 *   Sentry.init({ dsn: process.env.SENTRY_DSN });
 *   registerSentry(Sentry);
 */
export function registerSentry(instance: SentryLike): void {
  _sentry = instance;
}

/**
 * Record an exception. Always annotates the active OpenTelemetry span (so the error shows up in
 * traces regardless of Sentry), and forwards to Sentry when one has been registered. Never throws.
 */
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  try {
    const span = trace.getActiveSpan();
    if (span) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof Error) span.recordException(err);
    }
  } catch {
    /* telemetry must never throw into the caller */
  }
  if (_sentry) {
    try {
      _sentry.captureException(err, context ? { extra: context } : undefined);
    } catch {
      /* swallow — error tracking must not cascade */
    }
  }
}

/**
 * Fire-and-forget alerting hook. Posts a Slack-compatible JSON payload to ALERT_WEBHOOK_URL when
 * set; a no-op otherwise. Use for critical conditions (outbox backlog, repeated failures, health
 * flips). Never throws and never blocks the caller on failure.
 */
export async function notifyAlert(message: string, detail: Record<string, unknown> = {}): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url || typeof fetch !== 'function') return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: `[${process.env.OTEL_SERVICE_NAME || 'baalvion'}] ${message}`,
        ...detail,
      }),
    });
  } catch {
    /* alerting failures must not cascade into application logic */
  }
}
