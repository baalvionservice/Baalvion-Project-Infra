import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  adminBillingApi,
  type AdminSubscriptionRow,
  type SubscriptionSummary,
  type AdminPlan,
  type AdminPlanInput,
  type RevenueReport,
} from '@/lib/api/admin-billing';

const KEY = 'admin-billing';

export const useBillingSummary = () =>
  useQuery<SubscriptionSummary>({
    queryKey: [KEY, 'summary'],
    queryFn: () => adminBillingApi.summary().then((r) => r.data.data),
    staleTime: 30_000,
  });

export const useAdminSubscriptions = (params?: { page?: number; pageSize?: number; status?: string; q?: string }) =>
  useQuery<{ data: AdminSubscriptionRow[]; total: number; page: number; pageSize: number; totalPages: number }>({
    queryKey: [KEY, 'subscriptions', params],
    queryFn: () => adminBillingApi.listSubscriptions(params).then((r) => r.data.data),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

export const useRevenueByCustomer = () =>
  useQuery<RevenueReport>({
    queryKey: [KEY, 'revenue'],
    queryFn: () => adminBillingApi.revenue().then((r) => r.data.data),
    staleTime: 30_000,
  });

export const useAdminPlans = () =>
  useQuery<AdminPlan[]>({
    queryKey: [KEY, 'plans'],
    queryFn: () => adminBillingApi.listPlans().then((r) => r.data.data),
    staleTime: 60_000,
  });

export const useCreatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminPlanInput) => adminBillingApi.createPlan(body).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'plans'] }),
  });
};

export const useUpdatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AdminPlanInput }) => adminBillingApi.updatePlan(id, body).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'plans'] }),
  });
};

export const useDeletePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminBillingApi.deletePlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'plans'] }),
  });
};

export const useChangeOrgPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, planSlug }: { orgId: string; planSlug: string }) => adminBillingApi.changeOrgPlan(orgId, planSlug),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
};

export const useCancelOrgSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orgId: string) => adminBillingApi.cancelOrg(orgId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
};
