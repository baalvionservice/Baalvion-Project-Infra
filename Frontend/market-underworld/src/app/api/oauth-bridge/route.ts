import { NextRequest, NextResponse } from 'next/server';

// oauth-service's public authorize endpoint. Called server-to-server only, never rendered
// as a browser link — the request carries this site's own Bearer access token.
const OAUTH_AUTHORIZE_URL = 'https://api.baalvion.com/oidc-provider/oauth/authorize';

/**
 * Bridges NodeBB's (or any relying party's) OAuth authorization request to oauth-service.
 *
 * oauth-service's /oauth/authorize needs the Baalvion hub session cookie to recognize a
 * signed-in browser, but that cookie is scoped to baalvion.com and never reaches this
 * marketunderworld.com origin. This route runs server-side on the same origin that holds
 * this site's own httpOnly access_token cookie (issued by auth-gateway via /auth-bff/*,
 * same signer/issuer/audience oauth-service verifies) and forwards it directly as a Bearer
 * token to oauth-service's POST /oauth/authorize, which accepts pre-authenticated callers.
 *
 * Takes the OAuth params as flat top-level query params (not a nested encoded URL) — the
 * Workers runtime (specifically NEXT_PRIVATE_MINIMAL_MODE, needed to work around
 * https://github.com/opennextjs/opennextjs-cloudflare/issues/1232) mishandles a URL nested
 * as a single query-param value, silently splitting it back apart on the inner `&`s.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const client_id = sp.get('client_id');
  const redirect_uri = sp.get('redirect_uri');
  if (!client_id || !redirect_uri) {
    return NextResponse.json({ error: 'client_id and redirect_uri are required' }, { status: 400 });
  }

  const signinUrl = new URL('/auth/signin', request.url);
  signinUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);

  const accessToken = request.cookies.get('access_token')?.value;
  if (!accessToken) {
    return NextResponse.redirect(signinUrl);
  }

  const requestBody: Record<string, string> = { client_id, redirect_uri, scope: sp.get('scope') ?? 'openid' };
  for (const key of ['state', 'code_challenge', 'code_challenge_method', 'nonce'] as const) {
    const value = sp.get(key);
    if (value) requestBody[key] = value;
  }

  const response = await fetch(OAUTH_AUTHORIZE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (response.status === 401) {
    // Expired/invalid session cookie — re-authenticate, then retry this same bridge.
    return NextResponse.redirect(signinUrl);
  }
  if (!response.ok) {
    return NextResponse.json({ error: 'authorization failed' }, { status: 502 });
  }

  const json: { data?: { code?: string; redirect_uri?: string; state?: string } } = await response.json();
  const { code, redirect_uri: validatedRedirectUri, state } = json.data ?? {};
  if (!code || !validatedRedirectUri) {
    return NextResponse.json({ error: 'malformed authorize response' }, { status: 502 });
  }

  const destination = new URL(validatedRedirectUri);
  destination.searchParams.set('code', code);
  if (state) destination.searchParams.set('state', state);
  return NextResponse.redirect(destination);
}
