import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { marketplaceAdminApi } from '@/lib/api/marketplace';

type Q = { page?: number; limit?: number; status?: string };
const onErr = (e: { message: string }) => toast.error(e.message);

export const mpCompanyKeys = { all: ['marketplace', 'companies'] as const };
export const useMpCompanies = (p?: Q) =>
  useQuery({ queryKey: [...mpCompanyKeys.all, p], queryFn: () => marketplaceAdminApi.companies(p).then((r) => r.data.data), placeholderData: keepPreviousData });
export const useReviewCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'reject'; note?: string }) =>
      marketplaceAdminApi.reviewCompany(id, { action, note }).then((r) => r.data.data),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: mpCompanyKeys.all }); toast.success(`Company ${v.action === 'approve' ? 'approved' : 'rejected'}`); },
    onError: onErr,
  });
};

export const mpDealKeys = { all: ['marketplace', 'deals'] as const };
export const useMpDeals = (p?: Q) =>
  useQuery({ queryKey: [...mpDealKeys.all, p], queryFn: () => marketplaceAdminApi.deals(p).then((r) => r.data.data), placeholderData: keepPreviousData });
export const useReleaseEscrow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, escrowId }: { dealId: string; escrowId: string }) => marketplaceAdminApi.releaseEscrow(dealId, escrowId).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: mpDealKeys.all }); toast.success('Escrow released — deal closed, cap table updated'); },
    onError: onErr,
  });
};

export const mpOppKeys = { all: ['marketplace', 'opportunities'] as const };
export const useMpOpportunities = (p?: Q) =>
  useQuery({ queryKey: [...mpOppKeys.all, p], queryFn: () => marketplaceAdminApi.opportunities(p).then((r) => r.data.data), placeholderData: keepPreviousData });

export const mpInvestorKeys = { all: ['marketplace', 'investors'] as const };
export const useMpInvestors = (p?: Q) =>
  useQuery({ queryKey: [...mpInvestorKeys.all, p], queryFn: () => marketplaceAdminApi.investors(p).then((r) => r.data.data), placeholderData: keepPreviousData });
export const useReviewInvestor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'reject'; note?: string }) =>
      marketplaceAdminApi.reviewInvestor(id, { action, note }).then((r) => r.data.data),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: mpInvestorKeys.all }); toast.success(`Investor ${v.action === 'approve' ? 'approved' : 'rejected'}`); },
    onError: onErr,
  });
};
