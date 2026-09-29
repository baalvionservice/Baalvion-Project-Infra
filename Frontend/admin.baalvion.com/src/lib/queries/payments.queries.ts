import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { paymentsApi } from '@/lib/api/payments';
import type { PaginationParams } from '@/lib/types/common.types';

export const paymentKeys = {
  summary: () => ['payments', 'summary'] as const,
  transactions: (p?: PaginationParams) => ['payments', 'transactions', p] as const,
  subscriptions: (p?: PaginationParams) => ['payments', 'subscriptions', p] as const,
  invoices: (p?: PaginationParams) => ['payments', 'invoices', p] as const,
  webhooks: (p?: PaginationParams) => ['payments', 'webhooks', p] as const,
};

export const usePaymentSummary = () =>
  useQuery({
    queryKey: paymentKeys.summary(),
    queryFn: () => paymentsApi.summary().then((r) => r.data.data),
    staleTime: 60_000,
  });

export const useTransactions = (params?: PaginationParams & { provider?: string; status?: string }) =>
  useQuery({
    queryKey: paymentKeys.transactions(params),
    queryFn: () => paymentsApi.transactions.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useSubscriptions = (params?: PaginationParams & { provider?: string; status?: string }) =>
  useQuery({
    queryKey: paymentKeys.subscriptions(params),
    queryFn: () => paymentsApi.subscriptions.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useInvoices = (params?: PaginationParams & { status?: string }) =>
  useQuery({
    queryKey: paymentKeys.invoices(params),
    queryFn: () => paymentsApi.invoices.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useWebhookLogs = (params?: PaginationParams & { provider?: string; status?: string }) =>
  useQuery({
    queryKey: paymentKeys.webhooks(params),
    queryFn: () => paymentsApi.webhooks.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useCancelSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cancelAtCycleEnd }: { id: string; cancelAtCycleEnd?: boolean }) =>
      paymentsApi.subscriptions.cancel(id, cancelAtCycleEnd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments', 'subscriptions'] });
      toast.success('Subscription cancelled');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useRetryWebhook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.webhooks.retry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments', 'webhooks'] });
      toast.success('Webhook retried');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
