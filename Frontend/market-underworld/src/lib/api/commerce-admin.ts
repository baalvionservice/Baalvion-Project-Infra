// Authenticated commerce-service writes (categories, stores) — separate from lib/api/commerce.ts,
// which is deliberately read-only/public storefront data hitting commerce-service directly. Every
// call here goes through the same-origin /api/commerce-proxy/* bridge (see
// src/app/api/commerce-proxy/[...path]/route.ts), which translates the httpOnly access_token
// cookie into the Bearer header commerce-service's authMiddleware expects — mirrors
// lib/api/community.ts's proxy convention exactly.

const PROXY_BASE = '/api/commerce-proxy';

export interface CommerceStoreSummary {
  id: string;
  name: string;
  countryCode: string;
}

export interface CommerceCategory {
  id: string;
  storeId: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  seoMetadata: Record<string, unknown>;
  sortOrder: number;
  depth: number;
  isActive: boolean;
  productCount: number;
  createdAt?: string;
  updatedAt?: string;
  // Present only on the store-scoped tree response (GET /stores/:storeId/categories).
  children?: CommerceCategory[];
  // Present only on the cross-store admin response (GET /admin/categories).
  store?: CommerceStoreSummary;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  parentId?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  seoMetadata?: Record<string, unknown>;
  sortOrder?: number;
  isActive?: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

async function commerceFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    credentials: 'include',
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || `commerce API ${path} failed: ${res.status}`);
  }
  return body.data;
}

async function commerceFetchPaginated<T>(path: string): Promise<PaginatedResult<T>> {
  const res = await fetch(`${PROXY_BASE}${path}`, { credentials: 'include', cache: 'no-store' });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T[]> & { pagination?: Pagination };
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || `commerce API ${path} failed: ${res.status}`);
  }
  return { items: body.data, pagination: body.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 0, hasNext: false, hasPrev: false } };
}

// ── Stores (used by StoreAccessGuard + seller store pickers) ────────────────────────────────────

export async function listMyStores(): Promise<CommerceStoreSummary[]> {
  try {
    const res = await commerceFetchPaginated<CommerceStoreSummary>('/stores');
    return res.items;
  } catch {
    return [];
  }
}

// ── Store-scoped categories (seller manages their own store's tree) ─────────────────────────────

export async function listStoreCategories(storeId: string): Promise<CommerceCategory[]> {
  return commerceFetch<CommerceCategory[]>(`/stores/${storeId}/categories`);
}

export async function createStoreCategory(storeId: string, body: CategoryInput): Promise<CommerceCategory> {
  return commerceFetch<CommerceCategory>(`/stores/${storeId}/categories`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateStoreCategory(storeId: string, categoryId: string, body: Partial<CategoryInput>): Promise<CommerceCategory> {
  return commerceFetch<CommerceCategory>(`/stores/${storeId}/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteStoreCategory(storeId: string, categoryId: string): Promise<void> {
  await commerceFetch<null>(`/stores/${storeId}/categories/${categoryId}`, { method: 'DELETE' });
}

export async function reorderStoreCategories(storeId: string, order: { id: string; sortOrder: number }[]): Promise<void> {
  await commerceFetch<{ message: string }>(`/stores/${storeId}/categories/reorder`, {
    method: 'POST',
    body: JSON.stringify({ order }),
  });
}

// ── Cross-store admin categories (superadmin sees/manages every store's categories) ─────────────

export async function listAdminCategories(opts: { storeId?: string; search?: string; page?: number; limit?: number } = {}): Promise<PaginatedResult<CommerceCategory>> {
  const params = new URLSearchParams();
  if (opts.storeId) params.set('storeId', opts.storeId);
  if (opts.search) params.set('search', opts.search);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return commerceFetchPaginated<CommerceCategory>(`/admin/categories${qs ? `?${qs}` : ''}`);
}

export async function createAdminCategory(storeId: string, body: CategoryInput): Promise<CommerceCategory> {
  return commerceFetch<CommerceCategory>('/admin/categories', {
    method: 'POST',
    body: JSON.stringify({ storeId, ...body }),
  });
}

export async function updateAdminCategory(storeId: string, categoryId: string, body: Partial<CategoryInput>): Promise<CommerceCategory> {
  return commerceFetch<CommerceCategory>(`/admin/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify({ storeId, ...body }),
  });
}

export async function deleteAdminCategory(storeId: string, categoryId: string): Promise<void> {
  await commerceFetch<null>(`/admin/categories/${categoryId}?storeId=${storeId}`, { method: 'DELETE' });
}

// ── Products (seller listing management) ─────────────────────────────────────────────────────

export interface CommerceProduct {
  id: string;
  storeId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  productType: 'simple' | 'variable' | 'grouped' | 'bundle' | 'digital';
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';
  sku: string | null;
  tags: string[];
  seoMetadata: Record<string, unknown>;
  stockQuantity: number;
  isFeatured: boolean;
}

export interface ProductInput {
  categoryId?: string | null;
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  sku?: string;
  tags?: string[];
  seoMetadata?: Record<string, unknown>;
  stockQuantity?: number;
}

export interface ProductPricingInput {
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  currencyCode: string;
}

export async function listStoreProducts(storeId: string, opts: { search?: string; page?: number; limit?: number } = {}): Promise<PaginatedResult<CommerceProduct>> {
  const params = new URLSearchParams();
  if (opts.search) params.set('search', opts.search);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return commerceFetchPaginated<CommerceProduct>(`/stores/${storeId}/products${qs ? `?${qs}` : ''}`);
}

export async function getStoreProduct(storeId: string, productId: string): Promise<CommerceProduct> {
  return commerceFetch<CommerceProduct>(`/stores/${storeId}/products/${productId}`);
}

export async function createStoreProduct(storeId: string, body: ProductInput): Promise<CommerceProduct> {
  return commerceFetch<CommerceProduct>(`/stores/${storeId}/products`, { method: 'POST', body: JSON.stringify(body) });
}

export async function updateStoreProduct(storeId: string, productId: string, body: Partial<ProductInput>): Promise<CommerceProduct> {
  return commerceFetch<CommerceProduct>(`/stores/${storeId}/products/${productId}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function updateStoreProductPricing(storeId: string, productId: string, body: ProductPricingInput): Promise<unknown> {
  return commerceFetch<unknown>(`/stores/${storeId}/products/${productId}/pricing`, { method: 'PUT', body: JSON.stringify(body) });
}

// ── Product media (seller photo upload) ──────────────────────────────────────────────────────

export interface CommerceProductMedia {
  id: string;
  productId: string;
  mediaType: 'image' | 'video' | 'document';
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  sortOrder: number;
  isFeatured: boolean;
}

export async function listProductMedia(storeId: string, productId: string): Promise<CommerceProductMedia[]> {
  return commerceFetch<CommerceProductMedia[]>(`/stores/${storeId}/products/${productId}/media`);
}

export async function uploadProductMedia(storeId: string, productId: string, file: File, opts: { altText?: string; isFeatured?: boolean } = {}): Promise<CommerceProductMedia> {
  const form = new FormData();
  form.append('file', file);
  form.append('mediaType', 'image');
  if (opts.altText) form.append('altText', opts.altText);
  if (opts.isFeatured) form.append('isFeatured', 'true');
  const res = await fetch(`${PROXY_BASE}/stores/${storeId}/products/${productId}/media`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<CommerceProductMedia>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || `commerce media upload failed: ${res.status}`);
  }
  return body.data;
}

export async function setFeaturedMedia(storeId: string, productId: string, mediaId: string): Promise<void> {
  await commerceFetch<null>(`/stores/${storeId}/products/${productId}/media/${mediaId}/feature`, { method: 'POST' });
}

export async function deleteProductMedia(storeId: string, productId: string, mediaId: string): Promise<void> {
  await commerceFetch<null>(`/stores/${storeId}/products/${productId}/media/${mediaId}`, { method: 'DELETE' });
}
