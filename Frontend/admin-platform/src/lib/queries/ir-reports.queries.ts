import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { irReportsApi } from '@/lib/api/ir';
import type {
  IrReportListParams,
  CreateReportPayload,
  UpdateReportPayload,
} from '@/lib/types/ir.types';

export const irReportKeys = {
  all: ['ir', 'reports'] as const,
  list: (p?: IrReportListParams) => [...irReportKeys.all, 'list', p] as const,
  detail: (id: string) => [...irReportKeys.all, 'detail', id] as const,
};

export const useReports = (params?: IrReportListParams) =>
  useQuery({
    queryKey: irReportKeys.list(params),
    // unwrap the bespoke ir-service envelope → { items, total, page, limit, totalPages }
    queryFn: () => irReportsApi.list(params).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

export const useReport = (id: string) =>
  useQuery({
    queryKey: irReportKeys.detail(id),
    queryFn: () => irReportsApi.get(id).then((r) => r.data.data),
    enabled: !!id && id !== 'new',
  });

export const useCreateReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReportPayload) => irReportsApi.create(payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: irReportKeys.all });
      toast.success('Report created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateReport = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateReportPayload) => irReportsApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (data) => {
      qc.setQueryData(irReportKeys.detail(id), data);
      qc.invalidateQueries({ queryKey: irReportKeys.all });
      toast.success('Report saved');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => irReportsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: irReportKeys.all });
      toast.success('Report deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const usePublishReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => irReportsApi.publish(id).then((r) => r.data.data),
    onSuccess: (data) => {
      qc.setQueryData(irReportKeys.detail(data.id), data);
      qc.invalidateQueries({ queryKey: irReportKeys.all });
      toast.success('Report published — it is now live for investors');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
