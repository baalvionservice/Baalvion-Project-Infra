import { AppRole } from '@/lib/rbac/roles';

export interface UserSession {
  uid: string;
  email: string;
  role: AppRole;
  isSimulated?: boolean;
}

/**
 * Normalizes any role string (UI-facing `UserRole`, `AppRole`, or JWT claim)
 * into a concrete `AppRole` understood by the RBAC engine.
 */
export function normalizeCookieRole(rawRole: string): AppRole {
  const value = rawRole as string;

  // Already an AppRole – pass through
  if (
    value === 'public' ||
    value === 'p1_institutional' ||
    value === 'p2_spv' ||
    value === 'p3_operator' ||
    value === 'admin' ||
    value === 'compliance'
  ) {
    return value as AppRole;
  }

  // Map UI/UserRole-style values and JWT claims to RBAC roles
  switch (value) {
    case 'phase1':
    case 'P1Investor':
    case 'institutional':
      return 'p1_institutional';
    case 'phase2':
    case 'P2Investor':
    case 'spv':
      return 'p2_spv';
    case 'phase3':
    case 'P3Operator':
    case 'operator':
      return 'p3_operator';
    case 'ComplianceOfficer':
      return 'compliance';
    case 'admin':
      return 'admin';
    default:
      return 'public';
  }
}

/**
 * Decodes a JWT and extracts the payload without verifying the signature.
 * Signature verification must happen server-side (auth service).
 * Used in middleware (Edge runtime) where crypto APIs are limited.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Buffer is available in the Next.js Edge runtime
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isJwtExpired(payload: Record<string, unknown>): boolean {
  if (typeof payload.exp !== 'number') return false; // No exp → not expiring
  return payload.exp * 1000 < Date.now() + 30_000;
}

/**
 * Session Provider — supports both real JWT tokens and the legacy mock cookie.
 *
 * Priority:
 *  1. Real JWT token stored in `ir_baalvion_access_token` cookie (set by auth-client)
 *  2. Legacy `baalvion_session_mock` cookie (role string or JSON) — kept for
 *     backwards compatibility during the JWT transition period
 */
export function getSessionFromCookie(cookieValue?: string): UserSession {
  const defaultSession: UserSession = {
    uid: 'guest',
    email: 'guest@baalvion.com',
    role: 'public',
  };

  if (!cookieValue) return defaultSession;

  // ── Attempt 1: treat as a JWT (three dot-separated segments) ─────────────
  if (cookieValue.split('.').length === 3) {
    const payload = decodeJwtPayload(cookieValue);
    if (payload && !isJwtExpired(payload)) {
      return {
        uid: (payload.sub as string) || 'unknown',
        email: (payload.email as string) || '',
        role: normalizeCookieRole((payload.role as string) || 'public'),
      };
    }
    // Expired or malformed JWT → treat as unauthenticated
    return defaultSession;
  }

  // ── Attempt 2: legacy mock cookie (JSON object or plain role string) ─────
  try {
    if (cookieValue.startsWith('{')) {
      const parsed = JSON.parse(cookieValue) as UserSession;
      return {
        ...defaultSession,
        ...parsed,
        role: normalizeCookieRole(parsed.role as unknown as string),
      };
    }

    return {
      ...defaultSession,
      role: normalizeCookieRole(cookieValue),
    };
  } catch {
    return defaultSession;
  }
}
