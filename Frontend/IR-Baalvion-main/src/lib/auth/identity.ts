/**
 * SERVER-ONLY. Resolves the caller's real platform identity for server-to-server calls.
 *
 * The authority is the auth-gateway, never this app: it verifies the httpOnly access cookie,
 * confirms the session has not been revoked, and returns the canonical claims — including
 * `orgId`, which is what every tenant check downstream keys on. We forward the same access
 * token onward as a Bearer, so domain services verify RS256 themselves and this app never
 * asserts an identity it did not receive.
 *
 * If the access cookie has expired we rotate it through the gateway's /refresh once and replay
 * the resulting Set-Cookie headers on our own response, so the browser stays signed in.
 */
import { cookies } from 'next/headers';

const GATEWAY =
  process.env.AUTH_PROXY_TARGET || 'https://api.baalvion.com/api/v1/identity/auth/v1/auth';

// Gateway cookie names (auth-gateway config/appConfig.js). Overridable so a deployment that
// renames them stays consistent across the fleet.
const ACCESS_COOKIE = process.env.COOKIE_ACCESS_NAME || 'access_token';
const REFRESH_COOKIE = process.env.COOKIE_REFRESH_NAME || 'refresh_token';

export interface Identity {
  userId: string;
  email: string;
  orgId: string | null;
  roles: string[];
  /** Verifiable RS256 token to forward as `Authorization: Bearer`. */
  accessToken: string;
  /** Set-Cookie headers to replay when the session was rotated mid-request. */
  setCookies: string[];
}

const serializeCookies = (jar: { name: string; value: string }[]) =>
  jar.map((c) => `${c.name}=${c.value}`).join('; ');

/** Pull a cookie value out of the Set-Cookie headers a gateway response returned. */
function readSetCookie(headers: string[], name: string): string | null {
  for (const h of headers) {
    const m = h.match(new RegExp(`^${name}=([^;]+)`));
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

async function fetchMe(cookieHeader: string) {
  const res = await fetch(`${GATEWAY}/me`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.user ?? null;
}

export async function resolveIdentity(): Promise<Identity | null> {
  const jar = (await cookies()).getAll();
  const access = jar.find((c) => c.name === ACCESS_COOKIE)?.value;
  const refresh = jar.find((c) => c.name === REFRESH_COOKIE)?.value;
  if (!access && !refresh) return null;

  let cookieHeader = serializeCookies(jar);
  let accessToken = access ?? '';
  const setCookies: string[] = [];

  let user = accessToken ? await fetchMe(cookieHeader) : null;

  // Access cookie missing or expired — rotate once, then retry with the fresh token.
  if (!user && refresh) {
    const res = await fetch(`${GATEWAY}/refresh`, {
      method: 'POST',
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const issued = res.headers.getSetCookie?.() ?? [];
    setCookies.push(...issued);
    const rotated = readSetCookie(issued, ACCESS_COOKIE);
    if (!rotated) return null;
    accessToken = rotated;
    cookieHeader = serializeCookies([
      ...jar.filter((c) => c.name !== ACCESS_COOKIE),
      { name: ACCESS_COOKIE, value: rotated },
    ]);
    user = await fetchMe(cookieHeader);
  }

  if (!user?.userId) return null;
  return {
    userId: String(user.userId),
    email: user.email ?? '',
    orgId: user.orgId ?? null,
    roles: Array.isArray(user.roles) ? user.roles : [],
    accessToken,
    setCookies,
  };
}
