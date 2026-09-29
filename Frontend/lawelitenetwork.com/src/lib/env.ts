/**
 * Server-side environment access with fail-fast validation (production hardening).
 *
 * IMPORTANT: import this ONLY from server modules (route handlers, server components,
 * server-only libs). It reads `process.env[name]` dynamically, which is not inlined
 * for client bundles. It is consumed by src/lib/cms.ts and src/app/api/auth/_proxy.ts.
 *
 * Required backend URLs (AUTH_SERVICE_URL, CMS_PUBLIC_URL) MUST be injected at
 * deploy time. In production we refuse to silently fall back to a localhost /
 * wrong-domain default: a missing var throws at first use so the misconfiguration
 * surfaces immediately instead of routing requests to the wrong place. In
 * development a localhost default is allowed for DX.
 *
 * NEXT_PHASE === 'phase-production-build' is checked so that `next build` (which
 * runs with NODE_ENV=production but without runtime secrets) does not hard-fail
 * static generation — the throw only fires when actually serving a request.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_BUILD_PHASE = process.env.NEXT_PHASE === 'phase-production-build';

/**
 * Read a required server-side env var. Throws in production runtime when blank.
 * In development (or during the build phase) returns `devDefault`.
 */
export function requireServerEnv(name: string, devDefault: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (IS_PRODUCTION && !IS_BUILD_PHASE) {
    throw new Error(
      `[law-elite] Required environment variable ${name} is not set. ` +
        `Refusing to fall back to a localhost/dev default in production — ` +
        `inject ${name} at deploy time.`,
    );
  }
  return devDefault;
}
