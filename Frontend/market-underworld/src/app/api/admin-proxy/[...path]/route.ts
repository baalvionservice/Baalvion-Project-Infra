import { createProxy, proxyMethod } from '@/lib/api/proxy-handler';

// Same-origin bridge to admin-service (platform user/org management). Mirrors
// commerce-proxy/route.ts's cookie-to-Bearer translation — see lib/api/proxy-handler.ts.
//
// Base is the service's /v1 root, NOT /v1/admin — admin-service mounts several route groups as
// SIBLINGS under /v1 (routes/v1.js: /admin/*, /identity/*, /support/*, /ai/*, /developer/*,
// /staff/*), not all nested under /admin. Callers in admin-users.ts must include the full segment
// themselves (e.g. `/admin/users`, `/identity/risk-events`) — this proxy does no path rewriting.
const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE ?? 'https://api.baalvion.com/api/v1';
const proxy = createProxy(ADMIN_API_BASE);

export const GET = proxyMethod(proxy);
export const POST = proxyMethod(proxy);
export const PATCH = proxyMethod(proxy);
export const DELETE = proxyMethod(proxy);
