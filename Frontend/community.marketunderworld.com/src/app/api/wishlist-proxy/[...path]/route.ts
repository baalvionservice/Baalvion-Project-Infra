import { createProxy, proxyMethod } from '@/lib/api/proxy-handler';

// Same-origin bridge to order-service's wishlist tree. Wishlists are mounted as a SIBLING to
// /orders (routes/v1.js: router.use('/wishlists/stores/:storeId', ...)), not nested under it, so
// this needs its own base rather than reusing order-proxy's ORDER_API_BASE (which already bakes
// in the /orders segment).
const WISHLIST_API_BASE = process.env.WISHLIST_UPSTREAM_URL ?? '';
const proxy = createProxy(WISHLIST_API_BASE);

export const GET = proxyMethod(proxy);
export const POST = proxyMethod(proxy);
export const DELETE = proxyMethod(proxy);
