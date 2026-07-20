// Next.js client instrumentation hook (auto-loaded by the App Router). Initializes Sentry only
// when a public DSN is actually configured — a complete no-op otherwise, so this ships safely
// even before a Sentry project exists for this app.
import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
