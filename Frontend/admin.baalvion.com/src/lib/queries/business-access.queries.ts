'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { businessAccessApi } from '@/lib/api/business-access';

export const businessAccessKeys = {
  all: ['business-access'] as const,
  catalog: () => [...businessAccessKeys.all, 'catalog'] as const,
};

/** The businesses and their role vocabularies. Rarely changes — cached generously. */
export const useBusinessCatalog = () =>
  useQuery({
    queryKey: businessAccessKeys.catalog(),
    queryFn: () => businessAccessApi.catalog(),
    staleTime: 10 * 60_000,
  });

export const useAllBusinessGrants = () =>
  useQuery({
    queryKey: businessAccessKeys.all,
    queryFn: () => businessAccessApi.listAll(),
    staleTime: 30_000,
  });

export const useGrantBusinessAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: businessAccessApi.grant,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: businessAccessKeys.all });
      const names = res.granted.map((g) => g.business).join(', ');
      // The grant takes effect on their NEXT token, not instantly — say so rather than let
      // someone wonder why the person still cannot get in for a few minutes.
      toast.success(`Access granted: ${names} — applies on their next sign-in`);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useRevokeBusinessAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, business }: { userId: number; business?: string }) =>
      businessAccessApi.revoke(userId, business),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: businessAccessKeys.all });
      if (res.revoked.length === 0) { toast.info('There was no access to remove'); return; }
      toast.success(`Removed from ${res.revoked.map((r) => r.business).join(', ')}`);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
