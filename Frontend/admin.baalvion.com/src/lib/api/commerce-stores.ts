import { serviceClients } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type { CommerceStore, CommerceCategory, CommerceDiscount, CreateStorePayload, CreateDiscountPayload } from '@/lib/types/commerce.types';

const client = serviceClients.commerce;

export const commerceStoresApi = {
  stores: {
    list: (params?: PaginationParams & { status?: string }) =>
      client.get<PaginatedResponse<CommerceStore>>('/commerce/stores', { params }),
    get: (storeId: string) =>
      client.get<ApiResponse<CommerceStore>>(`/commerce/stores/${storeId}`),
    create: (payload: CreateStorePayload) =>
      client.post<ApiResponse<CommerceStore>>('/commerce/stores', payload),
    update: (storeId: string, payload: Partial<CreateStorePayload>) =>
      client.patch<ApiResponse<CommerceStore>>(`/commerce/stores/${storeId}`, payload),
    delete: (storeId: string) =>
      client.delete<ApiResponse<void>>(`/commerce/stores/${storeId}`),
  },

  categories: {
    list: (storeId: string) =>
      client.get<ApiResponse<CommerceCategory[]>>(`/commerce/stores/${storeId}/categories`),
    create: (storeId: string, payload: { name: string; parentId?: string; description?: string; sortOrder?: number }) =>
      client.post<ApiResponse<CommerceCategory>>(`/commerce/stores/${storeId}/categories`, payload),
    update: (storeId: string, categoryId: string, payload: Partial<CommerceCategory>) =>
      client.patch<ApiResponse<CommerceCategory>>(`/commerce/stores/${storeId}/categories/${categoryId}`, payload),
    delete: (storeId: string, categoryId: string) =>
      client.delete<ApiResponse<void>>(`/commerce/stores/${storeId}/categories/${categoryId}`),
    reorder: (storeId: string, order: Array<{ id: string; sortOrder: number }>) =>
      client.post<ApiResponse<void>>(`/commerce/stores/${storeId}/categories/reorder`, { order }),
  },

  discounts: {
    list: (storeId: string, params?: PaginationParams & { isActive?: boolean }) =>
      client.get<PaginatedResponse<CommerceDiscount>>(`/commerce/stores/${storeId}/discounts`, { params }),
    create: (storeId: string, payload: CreateDiscountPayload) =>
      client.post<ApiResponse<CommerceDiscount>>(`/commerce/stores/${storeId}/discounts`, payload),
    update: (storeId: string, discountId: string, payload: Partial<CreateDiscountPayload>) =>
      client.patch<ApiResponse<CommerceDiscount>>(`/commerce/stores/${storeId}/discounts/${discountId}`, payload),
    delete: (storeId: string, discountId: string) =>
      client.delete<ApiResponse<void>>(`/commerce/stores/${storeId}/discounts/${discountId}`),
    validate: (storeId: string, payload: { code: string; orderAmount: number }) =>
      client.post<ApiResponse<{ discount: CommerceDiscount; discountAmount: number }>>(`/commerce/stores/${storeId}/discounts/validate`, payload),
  },

  collections: {
    list: (storeId: string, params?: PaginationParams) =>
      client.get<PaginatedResponse<{ id: string; name: string; slug: string; productCount: number }>>(`/commerce/stores/${storeId}/collections`, { params }),
    create: (storeId: string, payload: { name: string; description?: string; isActive?: boolean }) =>
      client.post<ApiResponse<unknown>>(`/commerce/stores/${storeId}/collections`, payload),
    update: (storeId: string, collectionId: string, payload: Record<string, unknown>) =>
      client.patch<ApiResponse<unknown>>(`/commerce/stores/${storeId}/collections/${collectionId}`, payload),
    delete: (storeId: string, collectionId: string) =>
      client.delete<ApiResponse<void>>(`/commerce/stores/${storeId}/collections/${collectionId}`),
  },
};
