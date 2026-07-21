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

// Matches Backend/services/commerce/commerce-service/validators/storeSchemas.js:createStoreSchema
// exactly — code must be lowercase snake_case, countryCode/currencyCode are fixed-length ISO codes.
export interface CreateStoreInput {
  name: string;
  code: string;
  countryCode: string;
  currencyCode: string;
  locale?: string;
  timezone?: string;
}

export async function createStore(body: CreateStoreInput): Promise<CommerceStoreSummary> {
  return commerceFetch<CommerceStoreSummary>('/stores', { method: 'POST', body: JSON.stringify(body) });
}

// Full store record as returned by GET /stores — richer than CommerceStoreSummary (which only
// declares the fields the seller store-picker needs). Used by the cross-store admin registry.
export interface CommerceStoreAdmin {
  id: string;
  name: string;
  code: string;
  countryCode: string;
  currencyCode: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
}

export interface UpdateStoreInput {
  name?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  meta?: Record<string, unknown>;
}

export async function updateStore(storeId: string, body: UpdateStoreInput): Promise<CommerceStoreAdmin> {
  return commerceFetch<CommerceStoreAdmin>(`/stores/${storeId}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function getStoreAdmin(storeId: string): Promise<CommerceStoreAdmin & { meta?: Record<string, unknown> }> {
  return commerceFetch<CommerceStoreAdmin & { meta?: Record<string, unknown> }>(`/stores/${storeId}`);
}

export async function listAdminStores(opts: { search?: string; status?: string; page?: number; limit?: number } = {}): Promise<PaginatedResult<CommerceStoreAdmin>> {
  const params = new URLSearchParams();
  if (opts.search) params.set('search', opts.search);
  if (opts.status) params.set('status', opts.status);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return commerceFetchPaginated<CommerceStoreAdmin>(`/stores${qs ? `?${qs}` : ''}`);
}

// ── Seller applications (self-service onboarding, admin-approved) ───────────────────────────
// Store creation itself is restricted to super_admin/country_admin (commerce-service's
// canAdministerCountry check) — a regular user submits an application here instead; an admin
// reviews it in /admin/seller-applications and approving it is what actually calls createStore.

export interface SellerApplication {
  id: string;
  applicantUserId: string;
  applicantOrgId: string;
  storeName: string;
  storeCode: string;
  countryCode: string;
  currencyCode: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdStoreId: string | null;
  createdAt: string;
  legalFullName: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  identityVerified: boolean;
  payoutCurrency: string | null;
  payoutWalletAddress: string | null;
}

export interface SellerApplicationInput {
  storeName: string;
  storeCode: string;
  countryCode: string;
  currencyCode: string;
  description?: string;
  legalFullName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  payoutCurrency?: string;
  payoutWalletAddress?: string;
}

export async function submitSellerApplication(body: SellerApplicationInput): Promise<SellerApplication> {
  return commerceFetch<SellerApplication>('/seller-applications', { method: 'POST', body: JSON.stringify(body) });
}

export async function listMySellerApplications(): Promise<SellerApplication[]> {
  return commerceFetch<SellerApplication[]>('/seller-applications/mine');
}

export async function listSellerApplications(opts: { status?: string; page?: number; limit?: number } = {}): Promise<PaginatedResult<SellerApplication>> {
  const params = new URLSearchParams();
  if (opts.status) params.set('status', opts.status);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return commerceFetchPaginated<SellerApplication>(`/seller-applications${qs ? `?${qs}` : ''}`);
}

export async function approveSellerApplication(id: string): Promise<{ application: SellerApplication; storeId: string }> {
  return commerceFetch<{ application: SellerApplication; storeId: string }>(`/seller-applications/${id}/approve`, { method: 'POST' });
}

export async function verifySellerApplicationIdentity(id: string): Promise<SellerApplication> {
  return commerceFetch<SellerApplication>(`/seller-applications/${id}/verify-identity`, { method: 'POST' });
}

export async function rejectSellerApplication(id: string, reason: string): Promise<SellerApplication> {
  return commerceFetch<SellerApplication>(`/seller-applications/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
}

// ── Product moderation queue (admin) ─────────────────────────────────────────────────────────
// Backed by commerce-service's GET /admin/products/pending + PATCH /admin/products/:id/moderate —
// see productService.js:moderateProduct. A seller's "Publish" now submits for review (status
// pending_review) rather than going live directly; nothing reaches the public storefront without
// an admin approving it here.

export interface AdminProductQueueItem extends CommerceProduct {
  store?: CommerceStoreSummary;
  customFields?: Record<string, unknown>;
}

export async function listPendingProducts(opts: { page?: number; limit?: number } = {}): Promise<PaginatedResult<AdminProductQueueItem>> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return commerceFetchPaginated<AdminProductQueueItem>(`/admin/products/pending${qs ? `?${qs}` : ''}`);
}

export async function moderateProduct(storeId: string, productId: string, action: 'approve' | 'reject', reason?: string): Promise<CommerceProduct> {
  return commerceFetch<CommerceProduct>(`/admin/products/${productId}/moderate`, {
    method: 'PATCH',
    body: JSON.stringify({ storeId, action, reason }),
  });
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
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived' | 'rejected';
  sku: string | null;
  tags: string[];
  seoMetadata: Record<string, unknown>;
  stockQuantity: number;
  isFeatured: boolean;
  customFields?: Record<string, unknown>;
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

// ── Reviews (authenticated write) ────────────────────────────────────────────────────────────
// Public reads (approved-only, aggregate rating) go through the storefront route instead — see
// lib/api/commerce.ts's getProductReviews. This is the authenticated "submit my review" side.

export interface MyReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: 'pending' | 'approved' | 'rejected';
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export async function submitReview(storeId: string, productId: string, body: { rating: number; title?: string; body?: string }): Promise<MyReview> {
  return commerceFetch<MyReview>(`/stores/${storeId}/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(body) });
}

export async function getMyReview(storeId: string, productId: string): Promise<MyReview | null> {
  return commerceFetch<MyReview | null>(`/stores/${storeId}/products/${productId}/reviews/mine`);
}

// ── Discounts (admin — store-wide promo codes) ───────────────────────────────────────────────
// Gated at store_admin level in the UI even though the backend permits commerce_manager+: a
// discount here applies store-wide (this is ONE shared catalog across many sellers — see
// sellerApplicationService.js), so letting any individual seller mint store-wide promo codes
// would affect every other seller's products too. Admin-only by convention, not by route gate.

export interface Discount {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  minPurchaseAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  appliesTo: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export interface DiscountInput {
  code: string;
  name: string;
  type: Discount['type'];
  value: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export async function listDiscounts(storeId: string): Promise<Discount[]> {
  const res = await commerceFetchPaginated<Discount>(`/stores/${storeId}/discounts`);
  return res.items;
}

export async function createDiscount(storeId: string, body: DiscountInput): Promise<Discount> {
  return commerceFetch<Discount>(`/stores/${storeId}/discounts`, { method: 'POST', body: JSON.stringify(body) });
}

export async function updateDiscount(storeId: string, discountId: string, body: Partial<DiscountInput>): Promise<Discount> {
  return commerceFetch<Discount>(`/stores/${storeId}/discounts/${discountId}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteDiscount(storeId: string, discountId: string): Promise<void> {
  await commerceFetch<null>(`/stores/${storeId}/discounts/${discountId}`, { method: 'DELETE' });
}
