/**
 * @baalvion/service-kit — the golden path for a Baalvion service.
 *
 * `createService()` returns a production-ready Express app wired with the platform
 * standards every service must have, so a new service is correct-by-construction:
 *   - OpenTelemetry tracing + metrics (via @baalvion/telemetry)
 *   - structured request logging + correlation-id propagation
 *   - /healthz, /readyz, /metrics endpoints (k8s probes + Prometheus scrape)
 *   - centralized identity: JWT verification middleware (trusts the identity
 *     platform's JWKS — no service mints/trusts its own tokens)
 *   - the enterprise event bus (NATS/Kafka/Redis), ready to publish/subscribe
 *   - graceful shutdown (drain in-flight, close bus + server)
 *
 * Optional deps (express, jose) are loaded lazily so the package builds without
 * them; a real service installs them. This composes the EXISTING platform
 * packages — it does not reimplement them.
 */
import type { Transport } from '@baalvion/events';

export interface ServiceConfig {
  name: string;
  version?: string;
  port?: number;
  /** Identity: JWKS URL the service trusts (RS256). Omit to disable auth middleware. */
  jwksUrl?: string;
  issuer?: string;
  audience?: string;
  /** Event bus transport + config (defaults to noop when unset). */
  eventBus?: { transport: Transport; nats?: any; kafka?: any };
  /** Extra readiness checks (DB ping, redis ping, …) — all must resolve truthy. */
  readinessChecks?: Array<() => Promise<boolean> | boolean>;
  otlpEndpoint?: string;
}

export interface ServiceContext {
  app: any;            // express.Express
  bus: any;            // EventBus from @baalvion/events
  logger: any;
  config: ServiceConfig;
  listen(): Promise<{ close(): Promise<void> }>;
}

async function load(name: string): Promise<any> {
  try { return await import(name); } catch { return null; }
}

export async function createService(config: ServiceConfig): Promise<ServiceContext> {
  const telemetry = await import('@baalvion/telemetry');
  const eventsMod = await import('@baalvion/events');
  const shutdown = await import('@baalvion/graceful-shutdown');
  const expressMod = await load('express');
  if (!expressMod) throw new Error('service-kit: `express` must be installed by the service');
  const express = expressMod.default ?? expressMod;

  // 1. Telemetry first (auto-instruments http/pg/redis before app code runs).
  telemetry.initTelemetry({
    serviceName: config.name,
    serviceVersion: config.version ?? '0.0.0',
    otlpEndpoint: config.otlpEndpoint ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  } as any);
  const logger = telemetry.createLogger(config.name);
  const serviceMetrics = telemetry.createServiceMetrics(config.name);

  // 2. Event bus.
  const bus = await eventsMod.createEventBus({
    transport: config.eventBus?.transport ?? 'noop',
    nats: config.eventBus?.nats,
    kafka: config.eventBus?.kafka,
    logger,
  });

  // 3. App + platform middleware.
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(telemetry.requestLogger(logger));

  // 4. Health / readiness / metrics.
  app.get('/healthz', (_req: any, res: any) => res.status(200).json({ status: 'ok', service: config.name }));
  app.get('/readyz', async (_req: any, res: any) => {
    for (const check of config.readinessChecks ?? []) {
      try { if (!(await check())) return res.status(503).json({ status: 'not_ready' }); }
      catch { return res.status(503).json({ status: 'not_ready' }); }
    }
    res.status(200).json({ status: 'ready' });
  });
  app.get('/metrics', async (_req: any, res: any) => {
    res.set('Content-Type', 'text/plain');
    res.end(await serviceMetrics.register.metrics?.() ?? '');
  });

  // 5. Identity middleware (verify JWT against the central JWKS).
  if (config.jwksUrl) {
    const jose = await load('jose');
    if (!jose) {
      logger.warn?.({}, 'service-kit: `jose` not installed — JWT verification disabled');
    } else {
      const jwks = jose.createRemoteJWKSet(new URL(config.jwksUrl));
      app.use(async (req: any, res: any, next: any) => {
        const auth = req.headers['authorization'];
        if (!auth?.startsWith('Bearer ')) return next(); // public routes pass through; protect per-route
        try {
          const { payload } = await jose.jwtVerify(auth.slice(7), jwks, {
            issuer: config.issuer, audience: config.audience ?? config.name,
          });
          req.auth = { subject: payload.sub, orgId: payload.org_id, scopes: payload.scopes ?? [], roles: payload.roles ?? [] };
          next();
        } catch (err: any) {
          res.status(401).json({ error: { code: 'INVALID_TOKEN', message: err.message } });
        }
      });
    }
  }

  return {
    app, bus, logger, config,
    async listen() {
      const port = config.port ?? Number(process.env.PORT ?? 3000);
      const server = app.listen(port, () => logger.info?.({ port }, `${config.name} listening`));
      shutdown.initGracefulShutdown({ logger } as any);
      shutdown.registerShutdown('http', () => new Promise<void>((r) => server.close(() => r())));
      shutdown.registerShutdown('event-bus', () => bus.close());
      return { close: () => new Promise<void>((r) => server.close(() => r())) };
    },
  };
}

export type { Transport };
