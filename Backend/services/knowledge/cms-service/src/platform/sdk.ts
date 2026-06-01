import { createSdk, type PlatformSdk } from '@baalvion/sdk';
import { appConfig } from '../config';

/**
 * ⚠️ PHASE-F SEED (typed contract — NOT the current runtime).
 * The live cms-service runtime is CommonJS; the SDK is wired through
 * `platform/sdk.js` (+ logger/events/trace/bootstrap). This `src/` TypeScript
 * layer is the type-checked target for the deferred full-TS build convergence
 * (ADOPTION doc Phase F) and is kept in sync with the CJS runtime.
 *
 * The single @baalvion/sdk instance for cms-service.
 *
 * cms-service is the platform's SECRET VAULT and admin control plane. As such it
 * is the one service that owns AES encryption (the integrations store) and it
 * resolves its OWN tenant secrets directly from that store — it does NOT call
 * sdk.config for its own secrets (that would be calling itself). cms-service uses
 * the SDK for the cross-cutting standards every service shares: logging, tracing,
 * events, service-to-service auth, and resilient HTTP.
 */
let instance: PlatformSdk | null = null;

/** Initialise the one SDK instance (call once, from bootstrap). Idempotent. */
export async function initSdk(): Promise<PlatformSdk> {
  if (instance) return instance;
  instance = await createSdk({
    service: 'cms-service',
    version: appConfig.version,
    cms: {
      // Points at this service's own hub; used only if cms ever resolves ANOTHER
      // tenant's cross-service config — never for its own secret reads.
      baseUrl: appConfig.selfCmsApiBaseUrl,
      internalSecret: appConfig.internalSecret,
    },
    internalAuth: { secret: appConfig.internalSecret, scheme: 'shared-secret' },
    eventBus: { transport: appConfig.eventTransport },
    logLevel: appConfig.logLevel,
  });
  return instance;
}

/** Access the initialised SDK. Throws if used before initSdk(). */
export function sdk(): PlatformSdk {
  if (!instance) {
    throw new Error('[cms-service] SDK not initialised — call initSdk() in bootstrap before use');
  }
  return instance;
}
