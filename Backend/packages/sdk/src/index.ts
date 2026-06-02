/**
 * @baalvion/sdk — the Baalvion Platform SDK v1.
 *
 * The ONE way every service interacts with the platform: config/secret
 * resolution (CMS hub), service-to-service auth, resilient HTTP, the event bus,
 * structured logging, and end-to-end trace context — composed behind a single
 * `createSdk()` (and the `createPlatformService()` golden path).
 *
 * Design rule: this package COMPOSES the existing @baalvion/* packages and fills
 * the gaps. Services depend ONLY on @baalvion/sdk — never on the pieces directly.
 */
export * from './types';

export { createSdk } from './create-sdk';
export { createPlatformService } from './service';
export type { PlatformServiceConfig, PlatformService } from './service';

export { createTraceProvider, TRACE_HEADER, TENANT_HEADER } from './trace-context';
export { createBaseLogger, wrapLogger } from './logger';
export type { RawLogger } from './logger';
export { createConfigResolver } from './config-resolver';
export {
  createInternalAuth,
  SECRET_HEADER,
  SERVICE_HEADER,
  TS_HEADER,
  SIG_HEADER,
} from './internal-auth';
export { createHttpClient, CircuitOpenError } from './http-client';
export { createSdkEventBus } from './event-bus';
export { createMemoryCache } from './memory-cache';
