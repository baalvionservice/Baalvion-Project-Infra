/**
 * @file server/http/identity.ts
 * @description Trusted-principal verification for the trade API (CR-1).
 *
 * Identity is NEVER taken from client-supplied `x-actor-*` / `x-organization-id`
 * headers. The gateway forwards the authenticated principal as a signed
 * envelope: a base64url JSON document (`x-identity-envelope`) plus an
 * HMAC-SHA256 signature (`x-identity-signature`) computed with the shared
 * GATEWAY_SIGNING_SECRET. A request is authenticated only if the signature
 * verifies and the envelope has not expired. Anonymous requests, forged
 * headers and role spoofing all fail closed here.
 *
 * HARDENING (security review pass):
 *   - `jti` (nonce) + single-use enforcement for state-changing (unsafe) HTTP methods only.
 *     Safe methods (GET/HEAD) legitimately reuse the same cached envelope across many calls
 *     (see lib/local-api-client.ts) — enforcing single-use there would just break normal
 *     reads. Unsafe methods always carry a freshly-minted envelope (local-api-client never
 *     caches across writes), so single-use is meaningful rather than self-defeating there.
 *   - `aud`/`iss` claims scope an envelope to this bridge's intended purpose, so an envelope
 *     minted for one context can't be silently replayed against an unrelated trust boundary.
 *   - `exp - iat` is capped server-side regardless of what a caller of signIdentity() requests,
 *     so a future bug in a minting caller can't produce a long-lived bearer credential.
 *   - Verification tries the CURRENT secret first, then an optional PREVIOUS secret, so a
 *     secret rotation doesn't instantly invalidate every in-flight envelope (new envelopes are
 *     always signed with the current secret only).
 *   - `role` is validated against the known role vocabulary (fail closed) so a malformed or
 *     unexpected claim can never reach downstream authorization checks.
 *   - Every rejection path is logged via security-log.ts for audit/alerting, without ever
 *     logging secret material.
 */
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { UserRole, USER_ROLES } from '@/core/roles';
import { logSecurityEvent } from './security-log';

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/** A verified, gateway-attested principal. The ONLY trusted source of identity. */
export interface Principal {
  actorId: string;
  actorRole: UserRole;
  organizationId: string;
}

interface EnvelopeClaims {
  sub: string; // actorId
  role: string; // actorRole
  org: string; // organizationId (UUID)
  iat: number; // issued-at (epoch ms)
  exp: number; // expiry (epoch ms)
  jti: string; // unique nonce — single-use for state-changing requests
  aud: string; // audience — which trust boundary this envelope is scoped to
  iss: string; // issuer — which minting authority attested this principal
}

const ENVELOPE_HEADER = 'x-identity-envelope';
const SIGNATURE_HEADER = 'x-identity-signature';
const DEV_DEFAULT_SECRET = 'dev_gateway_signing_secret_change_me_min32';

// Short-lived by design: the local session bridge (/api/session/identity) re-mints well
// before this expires, and local-api-client.ts never caches a write's envelope at all.
const DEFAULT_TTL_MS = 90_000;
// Hard ceiling on any envelope's lifetime, regardless of what a caller of signIdentity()
// requests — defense-in-depth against a future minting bug producing a long-lived credential.
const MAX_TTL_MS = 10 * 60_000;

const ENVELOPE_AUDIENCE = 'gti-local-api';
const ENVELOPE_ISSUER = 'gti-session-bridge';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Defensive bound on actorId shape/length — gateway ids are short alphanumeric/UUID-ish
// identifiers; this exists to stop a malformed upstream response from propagating an
// oversized or control-character-laden value into a signed, cached credential.
const ACTOR_ID_RE = /^[\w.@:-]{1,128}$/;
const KNOWN_ROLES = new Set<string>(Object.values(USER_ROLES));

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// ── Single-use nonce guard (unsafe methods only) ────────────────────────────────────────
// LIMITATION: in-memory, per Node process. A horizontally-scaled deployment needs a shared
// store (Redis SETNX with a TTL matching the envelope's exp) for this to hold across
// instances — see the "remaining risks" note in the PR/report. Single-instance and
// sticky-session deployments get full protection from this as-is.
const consumedNonces = new Map<string, number>();
const NONCE_SWEEP_INTERVAL_MS = 60_000;
let lastNonceSweep = Date.now();

function sweepExpiredNonces(now: number): void {
  if (now - lastNonceSweep < NONCE_SWEEP_INTERVAL_MS) return;
  lastNonceSweep = now;
  for (const [jti, expiresAt] of consumedNonces) {
    if (expiresAt < now) consumedNonces.delete(jti);
  }
}

function consumeNonceOrThrow(claims: EnvelopeClaims): void {
  const now = Date.now();
  sweepExpiredNonces(now);
  if (consumedNonces.has(claims.jti)) {
    logSecurityEvent(
      'envelope_replay_detected',
      { jti: claims.jti, actorId: claims.sub, organizationId: claims.org },
      'critical',
    );
    throw new UnauthorizedError('Envelope already used');
  }
  consumedNonces.set(claims.jti, claims.exp);
}

/**
 * Resolve every secret that should be ACCEPTED for verification: the current secret, plus an
 * optional previous secret during a rotation window. Only index 0 (current) is ever used to
 * SIGN a new envelope — see {@link primarySecret}.
 */
function candidateSecrets(): string[] {
  const primary = process.env.GATEWAY_SIGNING_SECRET;
  const previous = process.env.GATEWAY_SIGNING_SECRET_PREVIOUS;
  const isProd = process.env.NODE_ENV === 'production';

  let resolvedPrimary: string;
  if (!primary || primary.length < 32 || primary === DEV_DEFAULT_SECRET) {
    if (isProd) {
      throw new Error(
        'GATEWAY_SIGNING_SECRET is missing, too short, or the known dev default; refusing to verify identities in production.',
      );
    }
    resolvedPrimary = primary && primary.length >= 16 ? primary : 'test_gateway_signing_secret_min_32_chars_long';
  } else {
    resolvedPrimary = primary;
  }

  const secrets = [resolvedPrimary];
  // A previous secret is accepted for VERIFICATION ONLY (rotation grace window) — it is never
  // returned as a signing candidate, so newly-minted envelopes always use the current secret.
  if (previous && previous.length >= 32 && previous !== resolvedPrimary) {
    secrets.push(previous);
  }
  return secrets;
}

/**
 * Resolve the signing secret. In production a strong, non-default secret is
 * mandatory — the process refuses to verify identities without it (fail-fast).
 */
export function identitySecret(): string {
  return candidateSecrets()[0];
}

function sign(envelopeB64: string, secret: string): string {
  return createHmac('sha256', secret).update(envelopeB64).digest('hex');
}

/** Timing-safe equality that also tolerates length mismatch without throwing. */
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

/** True if `signature` is a valid HMAC over `envelopeB64` for ANY accepted secret. */
function verifySignatureAgainstAnySecret(envelopeB64: string, signature: string): boolean {
  let matched = false;
  // Deliberately do NOT short-circuit on first non-match so verification time doesn't leak
  // which rotation slot (if any) is currently active — every candidate is always checked.
  for (const secret of candidateSecrets()) {
    const expected = sign(envelopeB64, secret);
    if (safeEqualHex(expected, signature)) matched = true;
  }
  return matched;
}

function extractClientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || null;
  return req.headers.get('x-real-ip');
}

/**
 * Verify the gateway identity envelope on a request and return the principal.
 * Throws {@link UnauthorizedError} for anonymous, forged, expired, replayed,
 * out-of-scope (aud/iss) or malformed-claim requests. Every rejection is logged.
 */
export function verifyIdentity(req: Request): Principal {
  const ip = extractClientIp(req);
  const path = (() => { try { return new URL(req.url).pathname; } catch { return req.url; } })();
  // Returns (never throws) the error so every call site does `throw rejection(...)` — a literal
  // `throw` is what TypeScript's definite-assignment analysis actually understands; routing the
  // throw through a `never`-typed helper call alone left `claims` "possibly unassigned" below.
  const rejection = (reason: string): UnauthorizedError => {
    logSecurityEvent('identity_rejected', { reason, ip, path, method: req.method }, 'warn');
    return new UnauthorizedError(reason === 'missing_envelope' ? 'Missing signed identity envelope' : reason);
  };

  const envelopeB64 = req.headers.get(ENVELOPE_HEADER);
  const signature = req.headers.get(SIGNATURE_HEADER);
  if (!envelopeB64 || !signature) {
    throw rejection('missing_envelope');
  }

  if (!verifySignatureAgainstAnySecret(envelopeB64, signature)) {
    throw rejection('Invalid identity signature');
  }

  let claims: EnvelopeClaims;
  try {
    claims = JSON.parse(Buffer.from(envelopeB64, 'base64url').toString('utf8')) as EnvelopeClaims;
  } catch {
    throw rejection('Malformed identity envelope');
  }

  if (!claims.sub || !claims.role || !claims.org || !claims.jti || !claims.aud || !claims.iss) {
    throw rejection('Incomplete identity envelope');
  }
  if (claims.aud !== ENVELOPE_AUDIENCE || claims.iss !== ENVELOPE_ISSUER) {
    throw rejection('Identity envelope is not scoped to this API');
  }
  if (!UUID_RE.test(claims.org)) {
    throw rejection('Identity organization is not a valid tenant id');
  }
  if (!ACTOR_ID_RE.test(claims.sub)) {
    throw rejection('Identity actor id is malformed');
  }
  if (!KNOWN_ROLES.has(claims.role)) {
    throw rejection('Identity role is not recognized');
  }
  if (
    typeof claims.exp !== 'number' ||
    typeof claims.iat !== 'number' ||
    claims.exp <= claims.iat ||
    claims.exp - claims.iat > MAX_TTL_MS
  ) {
    throw rejection('Identity envelope has an invalid lifetime');
  }
  if (claims.exp < Date.now()) {
    throw rejection('Identity envelope has expired');
  }

  if (UNSAFE_METHODS.has(req.method.toUpperCase())) {
    consumeNonceOrThrow(claims);
  }

  return {
    actorId: claims.sub,
    actorRole: claims.role as UserRole,
    organizationId: claims.org,
  };
}

/**
 * Mint a signed identity envelope. Used ONLY by the trusted server-side session bridge
 * (`/api/session/identity`) and by tests to exercise the trusted path. `nowMs` is injectable
 * so callers in environments without `Date.now` can supply a clock. `ttlMs` is clamped to
 * {@link MAX_TTL_MS} — a caller cannot mint a longer-lived envelope than that ceiling allows.
 */
export function signIdentity(
  principal: Principal,
  opts: { secret?: string; ttlMs?: number; nowMs?: number } = {},
): { [ENVELOPE_HEADER]: string; [SIGNATURE_HEADER]: string } {
  const secret = opts.secret ?? identitySecret();
  const now = opts.nowMs ?? Date.now();
  const requestedTtl = opts.ttlMs ?? DEFAULT_TTL_MS;
  const ttl = requestedTtl < 0 ? requestedTtl : Math.min(requestedTtl, MAX_TTL_MS);
  const claims: EnvelopeClaims = {
    sub: principal.actorId,
    role: String(principal.actorRole),
    org: principal.organizationId,
    iat: now,
    exp: now + ttl,
    jti: randomUUID(),
    aud: ENVELOPE_AUDIENCE,
    iss: ENVELOPE_ISSUER,
  };
  const envelopeB64 = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
  return {
    [ENVELOPE_HEADER]: envelopeB64,
    [SIGNATURE_HEADER]: sign(envelopeB64, secret),
  };
}

export { ENVELOPE_HEADER, SIGNATURE_HEADER };
