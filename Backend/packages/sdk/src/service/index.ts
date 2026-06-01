import { createSdk } from '../create-sdk';
import { loadOptional } from '../load-optional';
import type { SdkConfig, PlatformSdk } from '../types';

export interface PlatformServiceConfig extends SdkConfig {
  port?: number;
  /** JWKS URL for inbound user-JWT verification (service-kit identity middleware). */
  jwksUrl?: string;
  issuer?: string;
  audience?: string;
  readinessChecks?: Array<() => Promise<boolean> | boolean>;
  otlpEndpoint?: string;
}

export interface PlatformService {
  app: any; // express.Express
  sdk: PlatformSdk;
  logger: any;
  listen(): Promise<{ close(): Promise<void> }>;
}

/**
 * The golden path for a Baalvion service. Builds a service-kit Express app
 * (OpenTelemetry, /healthz, /readyz, /metrics, central JWKS identity, graceful
 * shutdown) and binds the full SDK to it — trace middleware first, `sdk` on
 * app.locals. The SDK owns the event bus, so service-kit's bus is left noop to
 * avoid a duplicate connection.
 *
 * A new service is then correct-by-construction: one import, one call, every
 * platform standard already wired.
 */
export async function createPlatformService(cfg: PlatformServiceConfig): Promise<PlatformService> {
  const sdk = await createSdk(cfg);

  const sk = await loadOptional<any>('@baalvion/service-kit');
  if (!sk?.createService) {
    throw new Error('createPlatformService requires @baalvion/service-kit and express to be installed in the consuming service');
  }
  const ctx: any = await sk.createService({
    name: cfg.service,
    version: cfg.version,
    port: cfg.port,
    jwksUrl: cfg.jwksUrl,
    issuer: cfg.issuer,
    audience: cfg.audience,
    readinessChecks: cfg.readinessChecks,
    otlpEndpoint: cfg.otlpEndpoint,
  });

  // SDK-standard request context: bind trace + tenant before any route handler.
  ctx.app.use(sdk.trace.middleware());
  ctx.app.locals.sdk = sdk;

  return { app: ctx.app, sdk, logger: ctx.logger, listen: ctx.listen };
}
