import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  shareholdersApi, earningsApi, eventsApi, filingsApi, documentsApi, performanceApi, marketApi, applicationsApi,
} from '@/lib/api/ir-modules';

type Page = { page?: number; limit?: number };
const onErr = (e: { message: string }) => toast.error(e.message);

// ── Shareholders ──────────────────────────────────────────────────────────────
export const shareholderKeys = { all: ['ir', 'shareholders'] as const };
export const useShareholders = (p?: Page) =>
  useQuery({ queryKey: [...shareholderKeys.all, p], queryFn: () => shareholdersApi.list(p).then((r) => r.data.data), placeholderData: keepPreviousData });
export const useSaveShareholder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: any }) =>
      (id ? shareholdersApi.update(id, body) : shareholdersApi.create(body)).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: shareholderKeys.all }); toast.success('Shareholder saved'); },
    onError: onErr,
  });
};
export const useDeleteShareholder = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => shareholdersApi.remove(id), onSuccess: () => { qc.invalidateQueries({ queryKey: shareholderKeys.all }); toast.success('Shareholder removed'); }, onError: onErr });
};

// ── Earnings ────────────────────────────────────────────────────────────────
export const earningsKeys = { all: ['ir', 'earnings'] as const };
export const useEarnings = (p?: Page) =>
  useQuery({ queryKey: [...earningsKeys.all, p], queryFn: () => earningsApi.list(p).then((r) => r.data.data), placeholderData: keepPreviousData });
export const useSaveEarnings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: any }) =>
      (id ? earningsApi.update(id, body) : earningsApi.create(body)).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: earningsKeys.all }); toast.success('Earnings call saved'); },
    onError: onErr,
  });
};

// ── Events ────────────────────────────────────────────────────────────────────
export const eventKeys = { all: ['ir', 'events'] as const };
export const useEvents = (p?: Page) =>
  useQuery({ queryKey: [...eventKeys.all, p], queryFn: () => eventsApi.list(p).then((r) => r.data.data), placeholderData: keepPreviousData });
export const useSaveEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: any }) =>
      (id ? eventsApi.update(id, body) : eventsApi.create(body)).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: eventKeys.all }); toast.success('Event saved'); },
    onError: onErr,
  });
};
export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => eventsApi.remove(id), onSuccess: () => { qc.invalidateQueries({ queryKey: eventKeys.all }); toast.success('Event removed'); }, onError: onErr });
};

// ── Filings ─────────────────────────────────────────────────────────────────
export const filingKeys = { all: ['ir', 'filings'] as const };
export const useFilings = (p?: Page) =>
  useQuery({ queryKey: [...filingKeys.all, p], queryFn: () => filingsApi.list(p).then((r) => r.data.data), placeholderData: keepPreviousData });
export const useSaveFiling = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: any }) =>
      (id ? filingsApi.update(id, body) : filingsApi.create(body)).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: filingKeys.all }); toast.success('Filing saved'); },
    onError: onErr,
  });
};
export const useDeleteFiling = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => filingsApi.remove(id), onSuccess: () => { qc.invalidateQueries({ queryKey: filingKeys.all }); toast.success('Filing removed'); }, onError: onErr });
};

// ── Documents ───────────────────────────────────────────────────────────────
export const documentKeys = { all: ['ir', 'documents'] as const };
export const useDocuments = (p?: Page) =>
  useQuery({ queryKey: [...documentKeys.all, p], queryFn: () => documentsApi.list(p).then((r) => r.data.data), placeholderData: keepPreviousData });
export const useSaveDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: any }) =>
      (id ? documentsApi.update(id, body) : documentsApi.create(body)).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: documentKeys.all }); toast.success('Document saved'); },
    onError: onErr,
  });
};
export const useDeleteDocument = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => documentsApi.remove(id), onSuccess: () => { qc.invalidateQueries({ queryKey: documentKeys.all }); toast.success('Document removed'); }, onError: onErr });
};

// ── Performance ───────────────────────────────────────────────────────────────
export const usePerformance = () =>
  useQuery({ queryKey: ['ir', 'performance'], queryFn: () => performanceApi.get().then((r) => r.data.data) });
export const useSavePerformance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => performanceApi.update(body).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ir', 'performance'] }); toast.success('Performance updated'); },
    onError: onErr,
  });
};

// ── Market snapshot ───────────────────────────────────────────────────────────
export const useMarket = () =>
  useQuery({ queryKey: ['ir', 'market'], queryFn: () => marketApi.get().then((r) => r.data.data) });
export const useSaveMarket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => marketApi.update(body).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ir', 'market'] }); toast.success('Market data updated'); },
    onError: onErr,
  });
};
export const useRefreshMarket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => marketApi.refresh().then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ir', 'market'] }); toast.success('Pulled latest quote from the live feed'); },
    onError: onErr,
  });
};

// ── Investor Applications (access requests) ────────────────────────────────────
export const applicationKeys = { all: ['ir', 'applications'] as const };
export const useApplications = (p?: { page?: number; limit?: number; status?: string }) =>
  useQuery({ queryKey: [...applicationKeys.all, p], queryFn: () => applicationsApi.list(p).then((r) => r.data.data), placeholderData: keepPreviousData });
export const useReviewApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'reject'; note?: string }) =>
      applicationsApi.review(id, { action, review_note: note }).then((r) => r.data.data),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: applicationKeys.all }); toast.success(`Application ${v.action === 'approve' ? 'approved' : 'rejected'}`); },
    onError: onErr,
  });
};
