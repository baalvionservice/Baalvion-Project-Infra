// Real commerce-service integration. Public storefront reads (no auth) go straight
// to api.baalvion.com — commerce-service mounts these routes without authMiddleware
// and sets permissive CORS specifically for them (index.js), so this is safe to call
// both server-side (Server Components) and client-side.
//
// MARKET_UNDERWORLD_STORE_ID is the real store provisioned in commerce-service's
// production database for this app (see docs/backend.json for provenance).

const COMMERCE_API_BASE = process.env.NEXT_PUBLIC_COMMERCE_API_BASE ?? 'https://api.baalvion.com/api/v1/commerce';
export const MARKET_UNDERWORLD_STORE_ID = process.env.NEXT_PUBLIC_MU_STORE_ID ?? '84d4dedc-be2e-43d7-adf3-82d54e7bdb2c';

export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  basePrice: number;
  price: number;
  currencyCode: string;
  imageUrl: string[];
  media: unknown[];
  isVip: boolean;
  ratingAverage: number;
  ratingCount: number;
  stock: number;
  inStock: boolean;
  status: string;
}

interface StorefrontListResponse {
  success: boolean;
  data: {
    items: StorefrontProduct[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

async function commerceFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${COMMERCE_API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`commerce API ${path} failed: ${res.status}`);
  return res.json();
}

export async function getStorefrontProducts(
  categorySlug?: string,
  opts: { country?: string; search?: string; limit?: number } = {}
): Promise<StorefrontProduct[]> {
  const params: Record<string, string> = { country: opts.country ?? 'us' };
  if (categorySlug) params.categoryId = categorySlug;
  if (opts.search) params.search = opts.search;
  if (opts.limit) params.limit = String(opts.limit);
  try {
    const res = await commerceFetch<StorefrontListResponse>(
      `/storefront/${MARKET_UNDERWORLD_STORE_ID}/products`,
      params
    );
    return res.data.items;
  } catch {
    return [];
  }
}

export async function getStorefrontProduct(idOrSlug: string, country = 'us') {
  return commerceFetch<{ success: boolean; data: StorefrontProduct & { pricing: unknown[] } }>(
    `/storefront/${MARKET_UNDERWORLD_STORE_ID}/products/${idOrSlug}`,
    { country }
  ).then((r) => r.data);
}
