import { NextRequest, NextResponse } from 'next/server';

// oauth-service's public authorize endpoint. Called server-to-server only, never rendered
// as a browser link — the request carries this site's own Bearer access token.
const OAUTH_AUTHORIZE_URL = 'https://api.baalvion.com/oidc-provider/oauth/authorize';

// Only ever bridge to oauth-service's own authorize endpoint — never an arbitrary
// caller-supplied host, since a successful call attaches the signed-in user's Bearer token.
function isSafeAuthorizeTarget(url: URL): boolean {
  return url.protocol === 'https:' && url.hostname === 'api.baalvion.com' && url.pathname.endsWith('/oauth/authorize');
}

/**
 * Bridges NodeBB's (or any relying party's) OAuth authorization request to oauth-service.
 *
 * oauth-service's /oauth/authorize needs the Baalvion hub session cookie to recognize a
 * signed-in browser, but that cookie is scoped to baalvion.com and never reaches this
 * marketunderworld.com origin. This route runs server-side on the same origin that holds
 * this site's own httpOnly access_token cookie (issued by auth-gateway via /auth-bff/*,
 * same signer/issuer/audience oauth-service verifies) and forwards it directly as a Bearer
 * token to oauth-service's POST /oauth/authorize, which accepts pre-authenticated callers.
 */
export async function GET(request: NextRequest) {
  const targetParam = request.nextUrl.searchParams.get('target');
  if (!targetParam) {
    return NextResponse.json({ error: 'missing target' }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(targetParam);
  } catch {
    return NextResponse.json({ error: 'invalid target' }, { status: 400 });
  }
  if (!isSafeAuthorizeTarget(target)) {
    return NextResponse.json({ error: 'target not allowed' }, { status: 400 });
  }

  const signinUrl = new URL('/auth/signin', request.url);
  signinUrl.searchParams.set('redirect', target.toString());

  const accessToken = request.cookies.get('access_token')?.value;
  if (!accessToken) {
    return NextResponse.redirect(signinUrl);
  }

  const params = target.searchParams;
  const response = await fetch(OAUTH_AUTHORIZE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      client_id: params.get('client_id'),
      redirect_uri: params.get('redirect_uri'),
      scope: params.get('scope') ?? 'openid',
      state: params.get('state') ?? undefined,
      code_challenge: params.get('code_challenge') ?? undefined,
      code_challenge_method: params.get('code_challenge_method') ?? undefined,
      nonce: params.get('nonce') ?? undefined,
    }),
  });

  if (response.status === 401) {
    // Expired/invalid session cookie — re-authenticate, then retry this same bridge.
    return NextResponse.redirect(signinUrl);
  }
  if (!response.ok) {
    return NextResponse.json({ error: 'authorization failed' }, { status: 502 });
  }

  const json: { data?: { code?: string; redirect_uri?: string; state?: string } } = await response.json();
  const { code, redirect_uri, state } = json.data ?? {};
  if (!code || !redirect_uri) {
    return NextResponse.json({ error: 'malformed authorize response' }, { status: 502 });
  }

  const destination = new URL(redirect_uri);
  destination.searchParams.set('code', code);
  if (state) destination.searchParams.set('state', state);
  return NextResponse.redirect(destination);
}
