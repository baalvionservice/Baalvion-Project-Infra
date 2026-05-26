import { serviceClients } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type { InventoryWarehouse, InventoryStockItem } from '@/lib/types/order.types';

const inventoryClient = serviceClients.inventory;
const fulfillmentClient = serviceClients.fulfillment;

export const inventoryApi = {
  warehouses: {
    list: (storeId: string, params?: PaginationParams & { isActive?: boolean }) =>
      inventoryClient.get<PaginatedResponse<InventoryWarehouse>>(`/inventory/stores/${storeId}/warehouses`, { params }),

    get: (storeId: string, warehouseId: string) =>
      inventoryClient.get<ApiResponse<InventoryWarehouse>>(`/inventory/stores/${storeId}/warehouses/${warehouseId}`),

    create: (storeId: string, payload: Partial<InventoryWarehouse>) =>
      inventoryClient.post<ApiResponse<InventoryWarehouse>>(`/inventory/stores/${storeId}/warehouses`, payload),

    update: (storeId: string, warehouseId: string, payload: Partial<InventoryWarehouse>) =>
      inventoryClient.patch<ApiResponse<InventoryWarehouse>>(`/inventory/stores/${storeId}/warehouses/${warehouseId}`, payload),

    delete: (storeId: string, warehouseId: string) =>
      inventoryClient.delete<ApiResponse<void>>(`/inventory/stores/${storeId}/warehouses/${warehouseId}`),
  },

  stock: {
    list: (storeId: string, params?: PaginationParams & { warehouseId?: string; productId?: string; status?: string; sku?: string }) =>
      inventoryClient.get<PaginatedResponse<InventoryStockItem>>(`/inventory/stores/${storeId}/stock`, { params }),

    adjust: (storeId: string, warehouseId: string, payload: { sku: string; productId: string; variantId?: string; quantity: number; type: string; reference?: string; notes?: string }) =>
      inventoryClient.post<ApiResponse<InventoryStockItem>>(`/inventory/stores/${storeId}/warehouses/${warehouseId}/stock/adjust`, payload),

    movements: (storeId: string, params?: PaginationParams & { warehouseId?: string; type?: string; sku?: string }) =>
      inventoryClient.get<PaginatedResponse<unknown>>(`/inventory/stores/${storeId}/movements`, { params }),
  },

  shipping: {
    zones: {
      list: (storeId: string, params?: PaginationParams) =>
        fulfillmentClient.get<PaginatedResponse<unknown>>(`/fulfillment/stores/${storeId}/zones`, { params }),
      create: (storeId: string, payload: Record<string, unknown>) =>
        fulfillmentClient.post<ApiResponse<unknown>>(`/fulfillment/stores/${storeId}/zones`, payload),
      update: (storeId: string, zoneId: string, payload: Record<string, unknown>) =>
        fulfillmentClient.patch<ApiResponse<unknown>>(`/fulfillment/stores/${storeId}/zones/${zoneId}`, payload),
      delete: (storeId: string, zoneId: string) =>
        fulfillmentClient.delete<ApiResponse<void>>(`/fulfillment/stores/${storeId}/zones/${zoneId}`),
      addRate: (storeId: string, zoneId: string, payload: Record<string, unknown>) =>
        fulfillmentClient.post<ApiResponse<unknown>>(`/fulfillment/stores/${storeId}/zones/${zoneId}/rates`, payload),
    },
    couriers: {
      list: (storeId: string) =>
        fulfillmentClient.get<ApiResponse<unknown[]>>(`/fulfillment/stores/${storeId}/couriers`),
      create: (storeId: string, payload: Record<string, unknown>) =>
        fulfillmentClient.post<ApiResponse<unknown>>(`/fulfillment/stores/${storeId}/couriers`, payload),
    },
    shipments: {
      list: (storeId: string, params?: PaginationParams & { status?: string; orderId?: string }) =>
        fulfillmentClient.get<PaginatedResponse<unknown>>(`/fulfillment/stores/${storeId}/shipments`, { params }),
      get: (storeId: string, shipmentId: string) =>
        fulfillmentClient.get<ApiResponse<unknown>>(`/fulfillment/stores/${storeId}/shipments/${shipmentId}`),
    },
  },
};
