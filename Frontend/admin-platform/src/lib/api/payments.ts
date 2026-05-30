import { adminApiClient } from './client';
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
      adminApiClient.get<PaginatedResponse<Transaction>>('/admin/payments/transactions', { params }),
    get: (id: string) => adminApiClient.get<ApiResponse<Transaction>>(`/admin/payments/transactions/${id}`),
  },

  subscriptions: {
    list: (params?: PaginationParams & { provider?: string; status?: string }) =>
      adminApiClient.get<PaginatedResponse<Subscription>>('/admin/payments/subscriptions', { params }),
    get: (id: string) => adminApiClient.get<ApiResponse<Subscription>>(`/admin/payments/subscriptions/${id}`),
    cancel: (id: string, cancelAtCycleEnd?: boolean) =>
      adminApiClient.post<ApiResponse<Subscription>>(`/admin/payments/subscriptions/${id}/cancel`, {
        cancelAtCycleEnd,
      }),
  },

  invoices: {
    list: (params?: PaginationParams & { status?: string }) =>
      adminApiClient.get<PaginatedResponse<Invoice>>('/admin/payments/invoices', { params }),
    get: (id: string) => adminApiClient.get<ApiResponse<Invoice>>(`/admin/payments/invoices/${id}`),
  },

  refunds: {
    list: (params?: PaginationParams) =>
      adminApiClient.get<PaginatedResponse<Refund>>('/admin/payments/refunds', { params }),
    create: (transactionId: string, amount: number, reason: string) =>
      adminApiClient.post<ApiResponse<Refund>>('/admin/payments/refunds', {
        transactionId,
        amount,
        reason,
      }),
  },

  webhooks: {
    list: (params?: PaginationParams & { provider?: string; status?: string }) =>
      adminApiClient.get<PaginatedResponse<WebhookLog>>('/admin/payments/webhooks', { params }),
    retry: (id: string) =>
      adminApiClient.post<ApiResponse<WebhookLog>>(`/admin/payments/webhooks/${id}/retry`),
  },

  summary: () =>
    adminApiClient.get<
      ApiResponse<{
        totalRevenue: number;
        activeSubscriptions: number;
        pendingInvoices: number;
        failedPayments: number;
      }>
    >('/admin/payments/summary'),
};
