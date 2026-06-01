import { createTraceProvider } from './trace-context';
import { createBaseLogger, wrapLogger } from './logger';
import { createInternalAuth } from './internal-auth';
import { createConfigResolver } from './config-resolver';
import { createHttpClient } from './http-client';
import { createSdkEventBus } from './event-bus';
import type { SdkConfig, PlatformSdk, TenantScopedSdk } from './types';

/**
 * Wire the whole SDK from one config. Every module shares the same trace provider
 * and logger, so correlation flows automatically: an inbound request → resolved
 * tenant keys → signed/traced outbound HTTP → emitted event all carry one traceId.
 */
export async function createSdk(cfg: SdkConfig): Promise<PlatformSdk> {
  const trace = createTraceProvider(cfg.service);
  const baseLogger = await createBaseLogger(cfg.service, cfg.logLevel);
  const logger = wrapLogger(baseLogger, trace, { service: cfg.service });

  const internalAuth = createInternalAuth({
    serviceName: cfg.service,
    secret: cfg.internalAuth.secret,
    scheme: cfg.internalAuth.scheme,
    logger,
  });

  const config = createConfigResolver({
    cmsBaseUrl: cfg.cms.baseUrl,
    internalSecret: cfg.cms.internalSecret,
    cacheTtlSeconds: cfg.cms.cacheTtlSeconds,
    cache: cfg.cache,
    logger,
  });

  const http = createHttpClient({
    defaultTimeoutMs: cfg.http?.defaultTimeoutMs,
    defaultRetries: cfg.http?.defaultRetries,
    circuitBreaker: cfg.http?.circuitBreaker,
    internalAuth,
    trace,
    logger,
  });

  const events = await createSdkEventBus({
    service: cfg.service,
    transport: cfg.eventBus?.transport,
    nats: cfg.eventBus?.nats,
    kafka: cfg.eventBus?.kafka,
    trace,
    logger,
  });

  function forTenant(tenantSlug: string): TenantScopedSdk {
    return {
      tenantSlug,
      getIntegration: (p) => config.getIntegration(tenantSlug, p),
      getSecret: (p, k) => config.getSecret(tenantSlug, p, k),
      getPaymentProvider: () => config.getPaymentProvider(tenantSlug),
      http,
      events: { publish: (et, p) => events.publish(et, p, { tenantId: tenantSlug }) },
      logger: logger.child({ tenant: tenantSlug }),
    };
  }

  logger.info({ transport: cfg.eventBus?.transport ?? 'noop' }, 'baalvion sdk initialised');

  return { service: cfg.service, config, internalAuth, http, events, logger, trace, forTenant, close: () => events.close() };
}
