'use strict';
/**
 * Anonymous read passthrough — the ONLY way past /api without a session.
 *
 * The open investor/company directory has to render for a visitor with no account and for
 * crawlers, so a fixed, explicit set of GET endpoints is proxied without a session. This is a
 * hole in the trust boundary, so it is deliberately as small as it can be:
 *
 *   • exact prefix match against ALLOW below — no wildcards, no regex, no per-service opt-in
 *   • GET and HEAD only; any other method falls through to the guarded chain
 *   • NO identity is injected, so the backend sees an anonymous caller and its own public
 *     controller decides what to return. Nothing here can reach an auth-gated route.
 *   • incoming cookies and Authorization are stripped, so a signed-in visitor's session can
 *     never be replayed through this path or leak into a cached response
 *
 * Anything not listed falls through untouched to requireSession → attachUser → requireCsrf.
 *
 * REVIEW: this changes the identity context's trust boundary — see CODEOWNERS.
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

// path prefix (as seen after the /api mount) -> upstream base
const ALLOW = [
  { prefix: '/insiders/v1/public/', target: process.env.SVC_INSIDERS || 'http://localhost:3050' },
];

const matched = (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const path = (req.url || '').split('?')[0];
  return ALLOW.find((a) => path.startsWith(a.prefix)) || null;
};

const proxy = createProxyMiddleware({
  changeOrigin: true,
  xfwd: true,
  router: (req) => matched(req).target,
  // /insiders/v1/public/investors -> /v1/public/investors (drop the service segment)
  pathRewrite: (path) => path.replace(/^\/[^/?]+/, '') || '/',
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.removeHeader('cookie');
      proxyReq.removeHeader('authorization');
      proxyReq.removeHeader('x-csrf-token');
    },
    proxyRes: (proxyRes) => {
      // Public and identical for everyone — safe for a CDN to hold briefly, and the header
      // makes it explicit that no per-user content can appear here.
      proxyRes.headers['cache-control'] = 'public, max-age=60, stale-while-revalidate=300';
      delete proxyRes.headers['set-cookie'];
    },
  },
});

module.exports = function publicReads(req, res, next) {
  if (!matched(req)) return next();
  return proxy(req, res, next);
};
