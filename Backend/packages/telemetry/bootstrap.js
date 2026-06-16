'use strict';
/**
 * @baalvion/telemetry/bootstrap — one-line, idempotent, OPT-IN startup instrumentation.
 *
 * Adoption: make this the FIRST require in a service entrypoint (before express/pg/ioredis),
 * so OpenTelemetry auto-instrumentation can patch them:
 *
 *     require('@baalvion/telemetry/bootstrap');   // line 1 (after 'use strict')
 *
 * SAFE / BACKWARD COMPATIBLE: it NO-OPS unless telemetry is explicitly enabled, so adding it
 * everywhere is byte-for-byte inert in local dev. It activates when ANY of these is set:
 *   - TELEMETRY_ENABLED=true
 *   - OTEL_EXPORTER_OTLP_ENDPOINT=<collector>   (traces/metrics export)
 *   - SENTRY_DSN=<dsn>                           (error reporting)
 *   - NODE_ENV=production
 *
 * It initializes OpenTelemetry exactly once (guarded), and — only when SENTRY_DSN is set AND
 * @sentry/node is installed in the service — initializes Sentry and registers it via the
 * telemetry DI hook (registerSentry). It NEVER throws into the caller: a telemetry failure
 * must never block a service from starting.
 *
 * Idempotency: a process-global flag means a double-require (or re-require) is a no-op, so
 * "initialization occurs exactly once" holds even if multiple modules require it.
 */

const FLAG = '__baalvionTelemetryBootstrapped__';

function enabled() {
  return process.env.TELEMETRY_ENABLED === 'true'
    || !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    || !!process.env.SENTRY_DSN
    || process.env.NODE_ENV === 'production';
}

function bootstrap() {
  if (globalThis[FLAG]) return;       // exactly-once guard (survives double-require)
  globalThis[FLAG] = true;
  if (!enabled()) return;             // inert unless explicitly configured (dev = no-op)

  let telemetry;
  try {
    telemetry = require('./dist/index.js');
  } catch (_) {
    return; // telemetry build missing → degrade silently, never block startup
  }

  const serviceName = process.env.OTEL_SERVICE_NAME
    || process.env.SERVICE_NAME
    || process.env.npm_package_name
    || 'baalvion-service';

  try {
    telemetry.initTelemetry({
      serviceName,
      serviceVersion: process.env.SERVICE_VERSION || process.env.npm_package_version,
      environment: process.env.NODE_ENV,
      otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    });
  } catch (_) { /* telemetry init must never crash the service */ }

  // Error reporting via DI: only when a DSN is configured AND @sentry/node is present.
  if (process.env.SENTRY_DSN) {
    try {
      // eslint-disable-next-line import/no-extraneous-dependencies, global-require
      const Sentry = require('@sentry/node');
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        release: process.env.SERVICE_VERSION || process.env.npm_package_version,
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
      });
      if (typeof telemetry.registerSentry === 'function') telemetry.registerSentry(Sentry);
    } catch (_) {
      // @sentry/node not installed in this service → OTel-only error capture (captureException
      // still records to the active span). Install @sentry/node where Sentry reporting is wanted.
    }
  }
}

bootstrap();

module.exports = {};
