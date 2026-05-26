import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { trace, metrics, context, propagation, SpanStatusCode } from '@opentelemetry/api';
import pino from 'pino';

export interface TelemetryConfig {
  serviceName: string;
  serviceVersion?: string;
  otlpEndpoint?: string;
  prometheusPort?: number;
  environment?: string;
  enablePrometheus?: boolean;
}

let _sdk: NodeSDK | null = null;

export function initTelemetry(config: TelemetryConfig): NodeSDK {
  const {
    serviceName,
    serviceVersion     = '1.0.0',
    otlpEndpoint       = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    prometheusPort     = parseInt(process.env.PROMETHEUS_PORT || '9464', 10),
    environment        = process.env.NODE_ENV || 'development',
    enablePrometheus   = true,
  } = config;

  const resource = new Resource({
    [ATTR_SERVICE_NAME]:    serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    'deployment.environment': environment,
  });

  const traceExporter  = new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` });
  const metricExporter = new OTLPMetricExporter({ url: `${otlpEndpoint}/v1/metrics` });

  const readers = [
    new PeriodicExportingMetricReader({ exporter: metricExporter, exportIntervalMillis: 15_000 }),
    ...(enablePrometheus
      ? [new PrometheusExporter({ port: prometheusPort, endpoint: '/metrics' })]
      : []),
  ];

  _sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader: readers[0] as PeriodicExportingMetricReader,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http':    { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-pg':      { enabled: true },
        '@opentelemetry/instrumentation-ioredis': { enabled: true },
        '@opentelemetry/instrumentation-fs':      { enabled: false },
      }),
    ],
  });

  _sdk.start();

  process.on('SIGTERM', () => {
    _sdk?.shutdown().catch(() => {});
  });

  return _sdk;
}

// ── Tracer / Meter helpers ────────────────────────────────────────────────────

export function getTracer(name: string) {
  return trace.getTracer(name);
}

export function getMeter(name: string) {
  return metrics.getMeter(name);
}

// ── Structured logger with trace correlation ──────────────────────────────────

export function createLogger(service: string, level = process.env.LOG_LEVEL || 'info') {
  return pino({
    level,
    base: { service },
    ...(process.env.NODE_ENV !== 'production' && {
      transport: { target: 'pino-pretty', options: { colorize: true } },
    }),
    redact: [
      'password', 'token', 'secret', 'authorization',
      'req.headers.authorization', 'req.headers.cookie',
    ],
    mixin() {
      const span = trace.getActiveSpan();
      if (!span) return {};
      const ctx = span.spanContext();
      return { traceId: ctx.traceId, spanId: ctx.spanId };
    },
  });
}

// ── Express middleware ────────────────────────────────────────────────────────

export function requestLogger(logger: ReturnType<typeof createLogger>) {
  return (req: any, res: any, next: () => void) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info({
        method:      req.method,
        url:         req.originalUrl,
        status:      res.statusCode,
        latencyMs:   Date.now() - start,
        requestId:   req.requestId,
        ip:          req.ip,
        userAgent:   req.headers['user-agent'],
      }, 'request');
    });
    next();
  };
}

// ── Span helpers ──────────────────────────────────────────────────────────────

export async function withSpan<T>(
  name: string,
  fn: (span: ReturnType<ReturnType<typeof getTracer>['startSpan']>) => Promise<T>,
  tracerName = 'baalvion',
): Promise<T> {
  const tracer = getTracer(tracerName);
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err?.message });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}

// ── Correlation ID extraction ─────────────────────────────────────────────────

export function extractCorrelationId(req: any): string {
  return (
    req.headers['x-correlation-id'] ||
    req.headers['x-request-id'] ||
    req.requestId ||
    'unknown'
  );
}

// ── Standard counters (create once, reuse) ────────────────────────────────────

export function createServiceMetrics(serviceName: string) {
  const meter = getMeter(serviceName);
  return {
    httpRequests: meter.createCounter('http_requests_total', {
      description: 'Total HTTP requests',
    }),
    httpDuration: meter.createHistogram('http_request_duration_ms', {
      description: 'HTTP request duration in milliseconds',
      unit: 'ms',
    }),
    dbQueryDuration: meter.createHistogram('db_query_duration_ms', {
      description: 'Database query duration in milliseconds',
      unit: 'ms',
    }),
    errorCount: meter.createCounter('errors_total', {
      description: 'Total errors',
    }),
    activeConnections: meter.createObservableGauge('active_connections', {
      description: 'Active connections',
    }),
  };
}

export { trace, metrics, context, propagation, SpanStatusCode };
