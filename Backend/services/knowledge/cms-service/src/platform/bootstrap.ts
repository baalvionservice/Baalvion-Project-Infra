import type { Express } from 'express';
import type { PlatformSdk } from '@baalvion/sdk';
import { initSdk } from './sdk';

export interface CmsPlatformContext {
  sdk: PlatformSdk;
}

/**
 * ⚠️ PHASE-F SEED (typed contract — NOT the current runtime; the live runtime is
 * `platform/bootstrap.js`). See `src/platform/sdk.ts` for the migration note.
 *
 * Boot the cms-service platform layer.
 *
 * Initialises the single SDK instance and exposes it on `app.locals.sdk`.
 *
 * NOTE — middleware mount ownership: the trace middleware must run BEFORE the
 * route layer, which means it is mounted in the server entrypoint at the correct
 * position in the chain (mirroring the CJS runtime, where `index.js` mounts it
 * before `/api/v1` and `platform/bootstrap.js` does NOT re-mount it). This seed
 * deliberately does NOT call `app.use(traceMiddleware)` — doing so here would
 * double-mount the trace context once Phase F promotes this file to the runtime.
 */
export async function bootstrapPlatform(app: Express): Promise<CmsPlatformContext> {
  const sdk = await initSdk();

  app.locals.sdk = sdk;

  sdk.logger.info(
    { transport: 'configured', service: 'cms-service' },
    'cms-service platform layer ready (SDK + trace bound)',
  );

  return { sdk };
}
