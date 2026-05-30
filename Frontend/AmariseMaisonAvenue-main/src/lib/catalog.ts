/**
 * Catalog data layer — the single source of storefront catalog data for Amarisé.
 * Reads the LIVE commerce-service public storefront API (no auth, published+public only).
 * Returns the exact `./types` shapes (Product / Department / Category / Collection) the
 * UI already renders, so consumers swap `mock-data` imports for these functions with no
 * shape changes. Usable from Server Components directly; client components use ./useCatalog.
 */
import type { Product, Department, Category, Collection } from './types';

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

export interface ProductQuery {
  categoryId?: string;
  collectionId?: string;
  isFeatured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getProducts(query: ProductQuery = {}): Promise<ProductsPage> {
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const q = qs.toString();
  return getJson<ProductsPage>(`/products${q ? `?${q}` : ''}`, EMPTY_PAGE);
}

export const getProductById = (idOrSlug: string) => getJson<Product | null>(`/products/${idOrSlug}`, null);
export const getDepartments = () => getJson<Department[]>('/departments', []);
export const getCategories = () => getJson<Category[]>('/categories', []);
export const getCollections = () => getJson<Collection[]>('/collections', []);
