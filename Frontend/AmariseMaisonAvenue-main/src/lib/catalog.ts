/**
 * Catalog data layer — the single source of storefront catalog data for Amarisé.
 * Reads the LIVE commerce-service public storefront API (no auth, published+public only).
 * Returns the exact `./types` shapes (Product / Department / Category / Collection) the
 * UI already renders, so consumers swap `mock-data` imports for these functions with no
 * shape changes. Usable from Server Components directly; client components use ./useCatalog.
 *
 * Multi-market: every query accepts an optional `country`. It is (a) forwarded to the
 * backend as `?country=` (the backend may filter or ignore it) and (b) enforced
 * client-side against each product's `regions` / `isGlobal` so a product scoped to
 * other jurisdictions never surfaces in the wrong market.
 */
import type { Product, Department, Category, Collection, CountryCode } from './types';
import { isSupportedCountry } from './i18n/countries';
import { resolveConfiguredStoreId } from './store-id';

// NEXT_PUBLIC_COMMERCE_URL is the PUBLIC storefront base (no auth), ending at `/api/v1`.
// This module appends `/commerce/storefront/:storeId/...`. The AUTHED/admin commerce base
// used by api-client.ts is a SEPARATE var (NEXT_PUBLIC_COMMERCE_API_URL) — see api-client.ts.
const COMMERCE_URL = process.env.NEXT_PUBLIC_COMMERCE_URL || 'http://localhost:3012/api/v1';

// Shared store-id resolution (subdomain → NEXT_PUBLIC_STORE_ID), the SAME source the authed
// store-context resolver falls back to. Resolved per-call so a subdomain match works client-side
// too; the public storefront has no JWT, so the env/subdomain config is the authoritative source.
function resolveStoreId(): string {
  return resolveConfiguredStoreId() || '';
}
function storefrontBase(): string {
  return `${COMMERCE_URL}/commerce/storefront/${resolveStoreId()}`;
}

export interface ProductsPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const EMPTY_PAGE: ProductsPage = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };

async function getJson<T>(path: string, fallback: T): Promise<T> {
  const storeId = resolveStoreId();
  if (!storeId) {
    // eslint-disable-next-line no-console -- deliberate startup diagnostic: misconfigured storefront (no store id)
    console.warn('[catalog] NEXT_PUBLIC_STORE_ID is not set — cannot resolve storefront');
    return fallback;
  }
  try {
    const res = await fetch(`${storefrontBase()}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return fallback;
    const json = await res.json();
    return (json && json.data !== undefined ? json.data : fallback) as T;
  } catch (err) {
    // eslint-disable-next-line no-console -- deliberate operator diagnostic: storefront fetch failed, falling back
    console.error('[catalog] fetch failed', path, err);
    return fallback;
  }
}

/** Append `?country=` (and merge with any existing query) when a valid country is given. */
function withCountry(path: string, country?: CountryCode): string {
  if (!isSupportedCountry(country)) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}country=${country}`;
}

/** A product is sellable in `country` if it is global, region-less, or explicitly tagged. */
export function isAvailableInCountry(product: Product, country?: CountryCode): boolean {
  if (!isSupportedCountry(country)) return true;
  if (product.isGlobal) return true;
  if (!product.regions || product.regions.length === 0) return true;
  return product.regions.includes(country);
}

export interface ProductQuery {
  categoryId?: string;
  collectionId?: string;
  isFeatured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  country?: CountryCode;
}

export async function getProducts(query: ProductQuery = {}): Promise<ProductsPage> {
  const { country, ...rest } = query;
  const qs = new URLSearchParams();
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const q = qs.toString();
  const page = await getJson<ProductsPage>(
    withCountry(`/products${q ? `?${q}` : ''}`, country),
    EMPTY_PAGE
  );

  if (!isSupportedCountry(country)) return page;

  // Belt-and-suspenders region enforcement in case the backend ignores `country`.
  const items = page.items.filter((p) => isAvailableInCountry(p, country));
  if (items.length === page.items.length) return page;
  const removed = page.items.length - items.length;
  return { ...page, items, total: Math.max(0, page.total - removed) };
}

export async function getProductById(
  idOrSlug: string,
  country?: CountryCode
): Promise<Product | null> {
  const product = await getJson<Product | null>(
    withCountry(`/products/${idOrSlug}`, country),
    null
  );
  if (!product) return null;
  // Out-of-market artifact → treat as not found so the page 404s in this country.
  if (!isAvailableInCountry(product, country)) return null;
  return product;
}

export const getDepartments = (country?: CountryCode) =>
  getJson<Department[]>(withCountry('/departments', country), []);
export const getCategories = (country?: CountryCode) =>
  getJson<Category[]>(withCountry('/categories', country), []);
export const getCollections = (country?: CountryCode) =>
  getJson<Collection[]>(withCountry('/collections', country), []);

// ── Product reviews (public, approved-only) ──────────────────────────────────
export interface PublicReview {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  author: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  reply?: string | null;
  replyAt?: string | null;
}
export interface ReviewsPage {
  items: PublicReview[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Server-computed mean over ALL approved reviews (C4) — NOT a page-scoped client mean. */
  ratingAverage?: number;
  /** Total approved reviews (C4). */
  ratingCount?: number;
}
const EMPTY_REVIEWS: ReviewsPage = { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 };

/** Approved customer reviews for a product (server computes the verified-purchase badge). */
export async function getProductReviews(
  idOrSlug: string,
  opts: { page?: number; limit?: number } = {}
): Promise<ReviewsPage> {
  const qs = new URLSearchParams();
  if (opts.page) qs.set('page', String(opts.page));
  if (opts.limit) qs.set('limit', String(opts.limit));
  const q = qs.toString();
  return getJson<ReviewsPage>(`/products/${idOrSlug}/reviews${q ? `?${q}` : ''}`, EMPTY_REVIEWS);
}

/** Honest related products: curated relations → same collection → same category → featured.
 *  Region-filtered server-side; belt-and-suspenders filtered again client-side. */
export async function getRelatedProducts(
  idOrSlug: string,
  country?: CountryCode,
  limit = 8
): Promise<Product[]> {
  const items = await getJson<Product[]>(
    withCountry(`/products/${idOrSlug}/related?limit=${limit}`, country),
    []
  );
  if (!Array.isArray(items)) return [];
  if (!isSupportedCountry(country)) return items;
  return items.filter((p) => isAvailableInCountry(p, country));
}
