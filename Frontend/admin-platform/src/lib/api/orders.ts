import { serviceClients } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type { Order, OrderCustomer, OrderReturn } from '@/lib/types/order.types';

const ordersClient = serviceClients.orders;

export const ordersApi = {
  orders: {
    list: (storeId: string, params?: PaginationParams & { status?: string; paymentStatus?: string; customerId?: string }) =>
      ordersClient.get<PaginatedResponse<Order>>(`/orders/stores/${storeId}/orders`, { params }),

    get: (storeId: string, orderId: string) =>
      ordersClient.get<ApiResponse<Order>>(`/orders/stores/${storeId}/orders/${orderId}`),

    create: (storeId: string, payload: Record<string, unknown>) =>
      ordersClient.post<ApiResponse<Order>>(`/orders/stores/${storeId}/orders`, payload),

    updateStatus: (storeId: string, orderId: string, status: Order['status']) =>
      ordersClient.patch<ApiResponse<Order>>(`/orders/stores/${storeId}/orders/${orderId}/status`, { status }),

    cancel: (storeId: string, orderId: string, reason: string) =>
      ordersClient.post<ApiResponse<Order>>(`/orders/stores/${storeId}/orders/${orderId}/cancel`, { reason }),

    recordPayment: (storeId: string, orderId: string, payload: Record<string, unknown>) =>
      ordersClient.post<ApiResponse<unknown>>(`/orders/stores/${storeId}/orders/${orderId}/payments`, payload),
  },

  customers: {
    list: (storeId: string, params?: PaginationParams & { isActive?: boolean }) =>
      ordersClient.get<PaginatedResponse<OrderCustomer>>(`/orders/stores/${storeId}/customers`, { params }),

    get: (storeId: string, customerId: string) =>
      ordersClient.get<ApiResponse<OrderCustomer>>(`/orders/stores/${storeId}/customers/${customerId}`),

    update: (storeId: string, customerId: string, payload: Partial<OrderCustomer>) =>
      ordersClient.patch<ApiResponse<OrderCustomer>>(`/orders/stores/${storeId}/customers/${customerId}`, payload),
  },

  returns: {
    list: (storeId: string, params?: PaginationParams & { status?: string; orderId?: string }) =>
      ordersClient.get<PaginatedResponse<OrderReturn>>(`/orders/stores/${storeId}/returns`, { params }),

    create: (storeId: string, payload: Record<string, unknown>) =>
      ordersClient.post<ApiResponse<OrderReturn>>(`/orders/stores/${storeId}/returns`, payload),

    updateStatus: (storeId: string, returnId: string, status: OrderReturn['status']) =>
      ordersClient.patch<ApiResponse<OrderReturn>>(`/orders/stores/${storeId}/returns/${returnId}/status`, { status }),
  },
};
