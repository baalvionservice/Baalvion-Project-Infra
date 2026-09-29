import { serviceClients } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type { Product, ProductVariant, CreateProductPayload } from '@/lib/types/commerce.types';

const client = serviceClients.commerce;

export interface ImportProductRow {
  name: string;
  category: string;
  shortDescription?: string;
  description?: string;
  sku?: string;
  price: number;
  currencyCode?: string;
  condition?: 'pristine' | 'excellent' | 'very_good' | 'good' | 'fair' | 'vintage';
  conditionNotes?: string;
  materials?: string[];
  tags?: string[];
  stockQuantity?: number;
}

export interface ImportProductsResult {
  total: number;
  created: number;
  failed: number;
  results: { row: number; success: boolean; name: string; productId?: string; error?: string }[];
}

export const commerceProductsApi = {
  list: (storeId: string, params?: PaginationParams & { status?: string; productType?: string; categoryId?: string; isFeatured?: boolean }) =>
    client.get<PaginatedResponse<Product>>(`/commerce/stores/${storeId}/products`, { params }),

  get: (storeId: string, productId: string) =>
    client.get<ApiResponse<Product>>(`/commerce/stores/${storeId}/products/${productId}`),

  create: (storeId: string, payload: CreateProductPayload) =>
    client.post<ApiResponse<Product>>(`/commerce/stores/${storeId}/products`, payload),

  update: (storeId: string, productId: string, payload: Partial<CreateProductPayload>) =>
    client.patch<ApiResponse<Product>>(`/commerce/stores/${storeId}/products/${productId}`, payload),

  delete: (storeId: string, productId: string) =>
    client.delete<ApiResponse<void>>(`/commerce/stores/${storeId}/products/${productId}`),

  publish: (storeId: string, productId: string) =>
    client.post<ApiResponse<Product>>(`/commerce/stores/${storeId}/products/${productId}/publish`),

  duplicate: (storeId: string, productId: string) =>
    client.post<ApiResponse<Product>>(`/commerce/stores/${storeId}/products/${productId}/duplicate`),

  bulkUpdate: (storeId: string, payload: { ids: string[]; action: 'publish' | 'archive' | 'delete' | 'assign_category'; categoryId?: string }) =>
    client.post<ApiResponse<{ updated: number }>>(`/commerce/stores/${storeId}/products/bulk`, payload),

  import: (storeId: string, rows: ImportProductRow[]) =>
    client.post<ApiResponse<ImportProductsResult>>(`/commerce/stores/${storeId}/products/import`, { rows }),

  variants: {
    list: (storeId: string, productId: string) =>
      client.get<ApiResponse<ProductVariant[]>>(`/commerce/stores/${storeId}/products/${productId}/variants`),

    create: (storeId: string, productId: string, payload: Partial<ProductVariant>) =>
      client.post<ApiResponse<ProductVariant>>(`/commerce/stores/${storeId}/products/${productId}/variants`, payload),

    update: (storeId: string, productId: string, variantId: string, payload: Partial<ProductVariant>) =>
      client.patch<ApiResponse<ProductVariant>>(`/commerce/stores/${storeId}/products/${productId}/variants/${variantId}`, payload),

    delete: (storeId: string, productId: string, variantId: string) =>
      client.delete<ApiResponse<void>>(`/commerce/stores/${storeId}/products/${productId}/variants/${variantId}`),
  },
};
