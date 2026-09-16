import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  paymentRecordsApi,
  type PaymentRecordsPage,
  type PaymentRecordsFilters,
  type SiteSummary,
} from '@/lib/api/payment-records';

const KEY = 'payment-records';

export const usePaymentRecords = (filters?: PaymentRecordsFilters) =>
  useQuery<PaymentRecordsPage>({
    queryKey: [KEY, 'list', filters],
    queryFn: () => paymentRecordsApi.list(filters).then((r) => r.data.data),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

export const usePaymentRecordsSummary = (params?: { from?: string; to?: string }) =>
  useQuery<{ sites: SiteSummary[] }>({
    queryKey: [KEY, 'summary', params],
    queryFn: () => paymentRecordsApi.summary(params).then((r) => r.data.data),
    staleTime: 30_000,
  });

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { partyApi, type PartyReview, type ReviewAction } from '@/lib/api/payment-records';

const PARTY_KEY = 'party-graph';

export const usePartyReviews = () =>
  useQuery<{ reviews: PartyReview[] }>({
    queryKey: [PARTY_KEY, 'reviews'],
    queryFn: () => partyApi.reviews().then((r) => r.data.data),
    staleTime: 15_000,
  });

export const useResolvePartyReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, survivorId }: { id: string; action: ReviewAction; survivorId?: string }) =>
      partyApi.resolve(id, { action, survivorId }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PARTY_KEY] });
      // A merge moves payment history onto the survivor, so the records view is stale too.
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
};
