import { createProxy, proxyMethod } from '@/lib/api/proxy-handler';

// Same-origin bridge to order-service (carts, orders). Base matches order-service's v1 router
// mount (routes/v1.js: router.use('/orders/stores/:storeId/carts', ...)) — callers pass paths
// like "stores/:storeId/carts" and this forwards to ".../api/v1/orders/stores/:storeId/carts".
const ORDER_API_BASE = process.env.NEXT_PUBLIC_ORDER_API_BASE ?? 'https://api.baalvion.com/api/v1/orders';
const proxy = createProxy(ORDER_API_BASE);

export const GET = proxyMethod(proxy);
export const POST = proxyMethod(proxy);
export const PATCH = proxyMethod(proxy);
export const DELETE = proxyMethod(proxy);
