/**
 * Canonical auth client → auth-service (Baalvion ID). Replaces the retired Keycloak
 * client (src/lib/keycloak.ts).
 *
 * Cookie-based: the refresh token lives in an httpOnly cookie set BY auth-service
 * (never read by JS); the access token is held in memory only (see apiClient.ts),
 * never in localStorage. No browser password grant, no realm endpoints.
 */
const AUTH_BASE =
  process.env.NEXT_PUBLIC_AUTH_URL || 'https://api.baalvion.com/api/v1/identity/auth/v1/auth';

export function decodeJwt(token: string): Record<string, any> {
  try {
    return JSON.parse(atob((token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

// App roles carried in the canonical roles[] claim (NOT Keycloak realm_access).
const KNOWN_ROLES = ['admin', 'recruiter', 'interviewer', 'finance', 'client', 'candidate', 'creator', 'brand', 'lawyer'];

/** Derive a portal user from canonical access-token claims. */
export function userFromToken(token: string) {
  const c = decodeJwt(token);
  const roles: string[] = Array.isArray(c.roles) ? c.roles : c.role ? [c.role] : [];
  const role = roles.find((r) => KNOWN_ROLES.includes(r)) ?? roles[0] ?? 'candidate';
  return { id: c.sub as string, email: c.email as string, name: (c.name ?? c.email) as string, role, roles, status: 'active' };
}

async function postJson(path: string, body?: unknown): Promise<Record<string, any>> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send + receive the httpOnly refresh cookie
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || json?.message || res.statusText || 'Request failed');
  return json?.data ?? json;
}

/** Password login against auth-service. Server sets the httpOnly refresh cookie. */
export async function login(email: string, password: string): Promise<{ access_token: string; user: ReturnType<typeof userFromToken> }> {
  const data = await postJson('/login', { email, password });
  const access = data.accessToken ?? data.access_token;
  return { access_token: access, user: userFromToken(access) };
}

/** Candidate self-registration against auth-service. Returns an access token (auto-login). */
export async function register(email: string, password: string, fullName?: string): Promise<{ access_token: string; user: ReturnType<typeof userFromToken> }> {
  const data = await postJson('/register', { email, password, full_name: fullName });
  const access = data.accessToken ?? data.access_token;
  return { access_token: access, user: userFromToken(access) };
}

/**
 * Refresh using the httpOnly cookie only — there is no JS-readable refresh token.
 * Single-flight: the auth-service ROTATES the refresh token on every call, so two
 * concurrent refreshes would invalidate each other (the 2nd uses a consumed token →
 * 401). AuthProvider and apiClient both refresh, so we dedupe through one in-flight
 * promise to avoid the rotation race.
 */
let _refreshInFlight: Promise<string | null> | null = null;
export async function refresh(): Promise<string | null> {
  if (_refreshInFlight) return _refreshInFlight;
  _refreshInFlight = (async () => {
    try {
      const data = await postJson('/refresh');
      return data.accessToken ?? data.access_token ?? null;
    } catch {
      return null;
    } finally {
      // brief settle so a burst of callers shares this result before re-arming
      setTimeout(() => { _refreshInFlight = null; }, 0);
    }
  })();
  return _refreshInFlight;
}

export async function logout(): Promise<void> {
  try { await postJson('/logout'); } catch { /* best-effort; cookie cleared server-side */ }
}
