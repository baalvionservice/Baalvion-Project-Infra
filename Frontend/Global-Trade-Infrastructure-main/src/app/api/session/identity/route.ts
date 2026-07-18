/**
 * @file app/api/session/identity/route.ts
 * @description Mints a short-lived, HMAC-signed identity envelope for the browser's OWN
 * authenticated session, so same-origin API routes under /api/trades/* etc — which trust ONLY
 * a signed envelope (see server/http/identity.ts) and never client-supplied headers — can be
 * called directly from client components without a separate gateway sitting in front of them.
 *
 * The envelope is derived EXCLUSIVELY from the verified gateway session (the httpOnly cookie
 * forwarded to the auth-gateway's own /auth/me), never from anything the client asserts about
 * itself — there is no request body, and no query/header field here influences the resulting
 * principal. This is the single choke point that can mint a valid credential; every field
 * feeding into it is treated as untrusted until validated.
 *
 * HARDENING (security review pass):
 *   - Calls the auth-gateway's real origin directly (GATEWAY_PROXY_TARGET) instead of building
 *     a URL from the request's own Host header, which a misconfigured/naive reverse proxy in
 *     front of this app could let a caller influence (Host-header trust issue).
 *   - Double-submit CSRF check (x-csrf-token header must match the readable csrf_token cookie)
 *     as defense-in-depth, even though this is a GET with no cross-origin-readable response.
 *   - Per-IP rate limiting — this endpoint fans out to the upstream gateway, so it is also a
 *     potential DoS-amplification vector if left unbounded.
 *   - Strict shape/format validation on every field pulled from the upstream session response
 *     before it is allowed to become part of a cryptographically signed credential.
 *   - Every mint (success or failure) is security-logged with actor/org/jti/ip, never with
 *     secret material.
 */
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { signIdentity } from '@/server/http/identity';
import { resolveAuthority } from '@/core/authority-mapping';
import { rateLimit, RateLimitError } from '@/server/http/api';
import { logSecurityEvent } from '@/server/http/security-log';

export const runtime = 'nodejs';

interface GatewayUser {
  id?: string;
  userId?: string;
  roles?: string[];
  orgId?: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTOR_ID_RE = /^[\w.@:-]{1,128}$/;
const GATEWAY_ORIGIN = process.env.GATEWAY_PROXY_TARGET || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3099' : '');

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || null;
  return req.headers.get('x-real-ip');
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function unauthorized(reason: string, ip: string | null): NextResponse {
  logSecurityEvent('session_identity_mint_rejected', { reason, ip }, 'warn');
  return NextResponse.json({ success: false, data: null, error: 'Not authenticated.' }, { status: 401 });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req);

  try {
    rateLimit(`session-identity:${ip ?? 'unknown'}`, 30, 60_000);
  } catch (e) {
    if (e instanceof RateLimitError) {
      logSecurityEvent('session_identity_rate_limited', { ip }, 'warn');
      return NextResponse.json({ success: false, data: null, error: 'Too many requests.' }, { status: 429 });
    }
    throw e;
  }

  // Double-submit CSRF check. The response body is not readable cross-origin regardless (no
  // ACAO header is set), but this closes even the "trigger a mint" nuisance/amplification
  // vector from a third-party page and keeps this endpoint consistent with how every other
  // unsafe-adjacent same-origin call in this app is protected.
  const csrfCookie = req.cookies.get('csrf_token')?.value;
  const csrfHeader = req.headers.get('x-csrf-token');
  if (!csrfCookie || !csrfHeader || !timingSafeStringEqual(csrfCookie, csrfHeader)) {
    return unauthorized('csrf_mismatch', ip);
  }

  if (!GATEWAY_ORIGIN) {
    logSecurityEvent('session_identity_misconfigured', { reason: 'missing_gateway_origin', ip }, 'critical');
    return NextResponse.json({ success: false, data: null, error: 'Session service unavailable.' }, { status: 502 });
  }

  const cookie = req.headers.get('cookie') ?? '';
  let meRes: Response;
  try {
    // Talk to the gateway's real origin directly — never derive it from this request's Host
    // header, which a reverse proxy could let a caller influence.
    meRes = await fetch(new URL('/auth/me', GATEWAY_ORIGIN), {
      headers: cookie ? { cookie } : {},
      cache: 'no-store',
    });
  } catch {
    logSecurityEvent('session_identity_upstream_unreachable', { ip }, 'critical');
    return NextResponse.json({ success: false, data: null, error: 'Session service unavailable.' }, { status: 502 });
  }

  if (!meRes.ok) {
    return unauthorized('gateway_session_invalid', ip);
  }

  const json = (await meRes.json().catch(() => null)) as { user?: GatewayUser } | null;
  const user = json?.user;
  const actorId = user ? String(user.id ?? user.userId ?? '') : '';
  const organizationId = user?.orgId ? String(user.orgId) : '';

  if (!user || !ACTOR_ID_RE.test(actorId)) {
    return unauthorized('invalid_actor_id', ip);
  }
  if (!UUID_RE.test(organizationId)) {
    return unauthorized('invalid_organization_id', ip);
  }

  const actorRole = resolveAuthority(user.roles);
  const headers = signIdentity({ actorId, actorRole, organizationId });

  logSecurityEvent('session_identity_minted', { actorId, organizationId, role: String(actorRole), ip });

  const res = NextResponse.json({
    success: true,
    data: {
      envelope: headers['x-identity-envelope'],
      signature: headers['x-identity-signature'],
    },
    error: null,
  });
  // Never let an intermediary (shared/CDN) cache cache a per-user credential.
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
