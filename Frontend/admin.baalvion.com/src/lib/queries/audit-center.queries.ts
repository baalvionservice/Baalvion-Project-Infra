import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  auditCenterApi,
  type AuditListParams,
  type AuditVerifyParams,
} from '@/lib/api/audit-center';

export const auditKeys = {
  all: ['audit'] as const,
  list: (p?: AuditListParams) => ['audit', 'list', p] as const,
  verify: (p?: AuditVerifyParams) => ['audit', 'verify', p] as const,
};

export const useAuditEvents = (params?: AuditListParams) =>
  useQuery({
    queryKey: auditKeys.list(params),
    // audit-service returns RAW JSON, so read r.data ({ items, total, limit, offset }).
    queryFn: () => auditCenterApi.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useVerifyAuditChain = () =>
  useMutation({
    mutationFn: (params?: AuditVerifyParams) =>
      auditCenterApi.verify(params).then((r) => r.data),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(`Integrity verified — ${result.checked} events, hash chain intact`);
      } else {
        toast.error(
          `Integrity broken at seq ${result.brokenAtSeq ?? '?'}${result.reason ? `: ${result.reason}` : ''}`,
        );
      }
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

export const useExportAuditCsv = () =>
  useMutation({
    mutationFn: (params?: AuditListParams) =>
      auditCenterApi.exportCsv(params).then((r) => r.data),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Audit log exported');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
