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

// Detail-only fields serializeProductDetail() adds on top of the list-item shape (see
// commerce-service/utils/storefrontSerializer.js) — seoTitle/seoDescription are sourced from
// seoMetadata.title/seoMetadata.description (the key names the seller listing-edit form writes;
// NOT metaTitle/metaDescription, despite that being the more obvious guess).
export interface StorefrontProductDetail extends StorefrontProduct {
  description: string;
  condition?: string;
  conditionGrade?: string;
  conditionDetails?: string;
  authenticityStatus?: string;
  authenticityCertificateCode?: string;
  isOneOfAKind: boolean;
  serialNumber?: string;
  targetKeyword?: string;
  seoTitle?: string;
  seoDescription?: string;
  pricing: unknown[];
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

export async function getStorefrontProduct(idOrSlug: string, country = 'us'): Promise<StorefrontProductDetail> {
  return commerceFetch<{ success: boolean; data: StorefrontProductDetail }>(
    `/storefront/${MARKET_UNDERWORLD_STORE_ID}/products/${idOrSlug}`,
    { country }
  ).then((r) => r.data);
}

export async function getRelatedProducts(idOrSlug: string, country = 'us'): Promise<StorefrontProduct[]> {
  try {
    const res = await commerceFetch<{ success: boolean; data: StorefrontProduct[] }>(
      `/storefront/${MARKET_UNDERWORLD_STORE_ID}/products/${idOrSlug}/related`,
      { country }
    );
    return res.data;
  } catch {
    return [];
  }
}

export interface StorefrontCategory {
  id: string;
  departmentId: string;
  name: string;
  subcategories: string[];
}

export interface StorefrontDepartment {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  categories: string[];
}

export async function getStorefrontCategories(): Promise<StorefrontCategory[]> {
  try {
    const res = await commerceFetch<{ success: boolean; data: StorefrontCategory[] }>(
      `/storefront/${MARKET_UNDERWORLD_STORE_ID}/categories`
    );
    return res.data;
  } catch {
    return [];
  }
}

export async function getStorefrontDepartments(): Promise<StorefrontDepartment[]> {
  try {
    const res = await commerceFetch<{ success: boolean; data: StorefrontDepartment[] }>(
      `/storefront/${MARKET_UNDERWORLD_STORE_ID}/departments`
    );
    return res.data;
  } catch {
    return [];
  }
}
