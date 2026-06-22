/**
 * Cloudflare Worker for baalvion.com.
 *
 * baalvion.com is a static export served from Cloudflare Workers Static Assets. This Worker runs in
 * front of those assets to add ONE capability: a same-origin auth edge. Requests to `/auth-bff/*`
 * are proxied to the central auth-service `/v1/auth/*` so the embedded /signin form can call
 * first-party (no CORS, refresh cookie lands on `.baalvion.com`). Everything else is served from the
 * static `out/` bundle unchanged — the apex marketing site is untouched.
 */
export interface Env {
  // The static-assets binding (structural type so this file needs no @cloudflare/workers-types).
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  // Base URL of the central auth-service (set via wrangler var/secret), e.g. https://api.baalvion.com
  AUTH_SERVICE_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/auth-bff/')) {
      const base = (env.AUTH_SERVICE_URL || '').replace(/\/+$/, '');
      if (!base) {
        return new Response(JSON.stringify({ success: false, error: { code: 'AUTH_UNAVAILABLE', message: 'Sign-in is temporarily unavailable.' } }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        });
      }
      // /auth-bff/email/otp/request  →  <auth-service>/v1/auth/email/otp/request
      const upstreamPath = url.pathname.replace(/^\/auth-bff/, '/v1/auth');
      const upstream = `${base}${upstreamPath}${url.search}`;
      // Preserve method, headers (incl. cookies), and body; follow no redirects (API is JSON).
      return fetch(new Request(upstream, request));
    }

    return env.ASSETS.fetch(request);
  },
};
