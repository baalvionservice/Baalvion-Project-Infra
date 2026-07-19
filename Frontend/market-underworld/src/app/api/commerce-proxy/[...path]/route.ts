import { createProxy, proxyMethod } from '@/lib/api/proxy-handler';

// Same-origin bridge to commerce-service (stores, categories, products, product media). Mirrors
// community-proxy/route.ts's cookie-to-Bearer translation, plus PATCH and a multipart pass-through
// for product-media upload — see lib/api/proxy-handler.ts for why those two extras exist here.
const COMMERCE_API_BASE = process.env.NEXT_PUBLIC_COMMERCE_API_BASE ?? 'https://api.baalvion.com/api/v1/commerce';
const proxy = createProxy(COMMERCE_API_BASE);

export const GET = proxyMethod(proxy);
export const POST = proxyMethod(proxy);
export const PATCH = proxyMethod(proxy);
export const DELETE = proxyMethod(proxy);
