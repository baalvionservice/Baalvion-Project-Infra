import apiClient from './client';
import type {
  Transaction,
  Subscription,
  Invoice,
  WebhookLog,
  Refund,
} from '@/lib/types/payment.types';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';

export const paymentsApi = {
  transactions: {
    list: (params?: PaginationParams & { provider?: string; status?: string }) =>
      apiClient.get<PaginatedResponse<Transaction>>('/admin/payments/transactions', { params }),
    get: (id: string) => apiClient.get<ApiResponse<Transaction>>(`/admin/payments/transactions/${id}`),
  },

  subscriptions: {
    list: (params?: PaginationParams & { provider?: string; status?: string }) =>
      apiClient.get<PaginatedResponse<Subscription>>('/admin/payments/subscriptions', { params }),
    get: (id: string) => apiClient.get<ApiResponse<Subscription>>(`/admin/payments/subscriptions/${id}`),
    cancel: (id: string, cancelAtCycleEnd?: boolean) =>
      apiClient.post<ApiResponse<Subscription>>(`/payment/razorpay/subscription/${id}`, {
        cancelAtCycleEnd,
      }),
  },

  invoices: {
    list: (params?: PaginationParams & { status?: string }) =>
      apiClient.get<PaginatedResponse<Invoice>>('/admin/payments/invoices', { params }),
    get: (id: string) => apiClient.get<ApiResponse<Invoice>>(`/admin/payments/invoices/${id}`),
  },

  refunds: {
    list: (params?: PaginationParams) =>
      apiClient.get<PaginatedResponse<Refund>>('/admin/payments/refunds', { params }),
    create: (transactionId: string, amount: number, reason: string) =>
      apiClient.post<ApiResponse<Refund>>('/payment/razorpay/refund', {
        transactionId,
        amount,
        reason,
      }),
  },

  webhooks: {
    list: (params?: PaginationParams & { provider?: string; status?: string }) =>
      apiClient.get<PaginatedResponse<WebhookLog>>('/admin/payments/webhooks', { params }),
    retry: (id: string) =>
      apiClient.post<ApiResponse<WebhookLog>>(`/admin/payments/webhooks/${id}/retry`),
  },

  summary: () =>
    apiClient.get<
      ApiResponse<{
        totalRevenue: number;
        activeSubscriptions: number;
        pendingInvoices: number;
        failedPayments: number;
      }>
    >('/admin/payments/summary'),
};
