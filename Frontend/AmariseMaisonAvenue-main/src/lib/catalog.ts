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

const COMMERCE_URL = process.env.NEXT_PUBLIC_COMMERCE_URL || 'http://localhost:3012/api/v1';
const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID || '';
const BASE = `${COMMERCE_URL}/commerce/storefront/${STORE_ID}`;

export interface ProductsPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const EMPTY_PAGE: ProductsPage = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };

async function getJson<T>(path: string, fallback: T): Promise<T> {
  if (!STORE_ID) {
    // eslint-disable-next-line no-console
    console.warn('[catalog] NEXT_PUBLIC_STORE_ID is not set — cannot resolve storefront');
    return fallback;
  }
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return fallback;
    const json = await res.json();
    return (json && json.data !== undefined ? json.data : fallback) as T;
  } catch (err) {
    // eslint-disable-next-line no-console
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
