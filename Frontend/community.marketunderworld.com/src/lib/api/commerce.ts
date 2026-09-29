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

export interface StorePaymentSettings {
  paymentMode: 'standard' | 'crypto_only';
  cryptoWallets: Record<string, string>;
}

export async function getStorePaymentSettings(): Promise<StorePaymentSettings> {
  try {
    const res = await commerceFetch<{ success: boolean; data: StorePaymentSettings }>(
      `/storefront/${MARKET_UNDERWORLD_STORE_ID}/payment-settings`
    );
    return res.data;
  } catch {
    return { paymentMode: 'standard', cryptoWallets: {} };
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

export interface ProductReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  author: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  reply: string | null;
  replyAt: string | null;
}

export interface ProductReviewsResult {
  items: ProductReview[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  ratingAverage: number;
  ratingCount: number;
}

export async function getProductReviews(idOrSlug: string, opts: { page?: number; limit?: number } = {}): Promise<ProductReviewsResult> {
  const params: Record<string, string> = {};
  if (opts.page) params.page = String(opts.page);
  if (opts.limit) params.limit = String(opts.limit);
  try {
    const res = await commerceFetch<{ success: boolean; data: ProductReviewsResult }>(
      `/storefront/${MARKET_UNDERWORLD_STORE_ID}/products/${idOrSlug}/reviews`,
      params
    );
    return res.data;
  } catch {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0, ratingAverage: 0, ratingCount: 0 };
  }
}

export interface DiscountPreview {
  valid: boolean;
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
  amount: number;
  eligibility: { minPurchaseAmount: number | null; appliesTo: string };
}

export async function previewDiscount(code: string, orderAmount: number): Promise<DiscountPreview> {
  const url = new URL(`${COMMERCE_API_BASE}/storefront/${MARKET_UNDERWORLD_STORE_ID}/discounts/validate`);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, orderAmount }),
  });
  const body = (await res.json().catch(() => ({}))) as { success: boolean; data?: DiscountPreview; error?: { message: string } };
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || 'That discount code is not valid.');
  }
  return body.data as DiscountPreview;
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
