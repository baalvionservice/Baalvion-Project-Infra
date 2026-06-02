export type StoreStatus = 'active' | 'inactive' | 'maintenance' | 'suspended';
export type ProductStatus = 'draft' | 'published' | 'archived' | 'scheduled' | 'approved';
export type ProductType = 'simple' | 'variable' | 'grouped' | 'bundle' | 'digital';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'partially_paid' | 'refunded' | 'voided' | 'failed';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled' | 'returned';

export interface CommerceStore {
  id: string;
  organizationId: string;
  name: string;
  slug?: string;
  code: string;
  countryCode: string;
  currencyCode: string;
  timezone?: string;
  email?: string;
  phone?: string;
  status: StoreStatus;
  settings: Record<string, unknown>;
  taxSettings: Record<string, unknown>;
  paymentSettings: Record<string, unknown>;
  shippingSettings: Record<string, unknown>;
  seoSettings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CommerceCategory {
  id: string;
  storeId: string;
  parentId: string | null;
  name: string;
  slug: string;
  description?: string;
  depth: number;
  sortOrder: number;
  productCount: number;
  isActive: boolean;
  seoMetadata: Record<string, unknown>;
  imageUrl?: string;
  children?: CommerceCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name?: string;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  currencyCode: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  attributeValues: Record<string, unknown>[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId?: string | null;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  productType: ProductType;
  status: ProductStatus;
  sku?: string;
  price?: number;
  basePrice?: number;
  compareAtPrice?: number | null;
  currencyCode?: string;
  brand?: string;
  isFeatured: boolean;
  isDigital: boolean;
  requiresShipping: boolean;
  viewCount: number;
  publishedAt?: string | null;
  tags: string[];
  seoMetadata: Record<string, unknown>;
  seoTitle?: string;
  seoDescription?: string;
  variants?: ProductVariant[];
  category?: Pick<CommerceCategory, 'id' | 'name' | 'slug'>;
  createdAt: string;
  updatedAt: string;
}

export type ProductMediaType = 'image' | 'video' | 'document';

export interface ProductMediaItem {
  id: string;
  productId: string;
  variantId: string | null;
  mediaType: ProductMediaType;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  sortOrder: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommerceDiscount {
  id: string;
  storeId: string;
  code: string;
  name?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  minOrderAmount?: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  usageLimit?: number;
  usedCount?: number;
  usageCount?: number;
  appliesTo?: 'all' | 'specific_products' | 'specific_categories' | 'specific_collections';
  targetIds?: string[];
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStorePayload {
  name: string;
  slug?: string;
  code?: string;
  countryCode: string;
  currencyCode: string;
  timezone?: string;
  email?: string;
  phone?: string;
}

export interface CreateProductPayload {
  name: string;
  categoryId?: string | null;
  shortDescription?: string;
  description?: string;
  productType?: ProductType;
  price?: number;
  basePrice?: number;
  compareAtPrice?: number;
  sku?: string;
  brand?: string;
  tags?: string[];
  isFeatured?: boolean;
  isDigital?: boolean;
  requiresShipping?: boolean;
}

export interface CreateDiscountPayload {
  code: string;
  name?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  minOrderAmount?: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  usageLimit?: number;
  appliesTo?: 'all' | 'specific_products' | 'specific_categories' | 'specific_collections';
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}
