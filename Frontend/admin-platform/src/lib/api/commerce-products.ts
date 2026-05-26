import { serviceClients } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type { Product, ProductVariant, CreateProductPayload } from '@/lib/types/commerce.types';

const client = serviceClients.commerce;

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
