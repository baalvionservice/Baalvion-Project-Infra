import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { rbacApi } from '@/lib/api/rbac';
import type { AssignRolePayload, RbacRole } from '@/lib/types/rbac.types';

export const rbacKeys = {
  all: ['rbac'] as const,
  countries: () => [...rbacKeys.all, 'countries'] as const,
  storesUnder: (countryTenantId: string) => [...rbacKeys.all, 'stores', countryTenantId] as const,
  roles: () => [...rbacKeys.all, 'roles'] as const,
  assignmentsByScope: (scopeId: string) => [...rbacKeys.all, 'assignments', 'scope', scopeId] as const,
  effective: (userId: string, scopeId?: string) => [...rbacKeys.all, 'effective', userId, scopeId ?? 'all'] as const,
};

export const useRbacCountries = () =>
  useQuery({
    queryKey: rbacKeys.countries(),
    queryFn: () => rbacApi.tenants.listCountries().then((r) => r.data.data ?? []),
    staleTime: 60_000,
  });

export const useRbacStoresUnder = (countryTenantId?: string) =>
  useQuery({
    queryKey: rbacKeys.storesUnder(countryTenantId ?? ''),
    queryFn: () => rbacApi.tenants.listStoresUnder(countryTenantId as string).then((r) => r.data.data ?? []),
    enabled: !!countryTenantId,
    staleTime: 60_000,
  });

export const useRbacRoles = () =>
  useQuery({
    queryKey: rbacKeys.roles(),
    queryFn: () => rbacApi.roles.list().then((r) => r.data.data ?? []),
    staleTime: 5 * 60_000,
  });

/** First role per key (roles are provisioned once on the platform tenant). */
export const useRbacRoleMap = () => {
  const query = useRbacRoles();
  const roleByKey = useMemo(() => {
    const map = new Map<string, RbacRole>();
    for (const role of query.data ?? []) {
      if (!map.has(role.key)) map.set(role.key, role);
    }
    return map;
  }, [query.data]);
  return { roleByKey, isLoading: query.isLoading, error: query.error };
};

export const useRbacAssignmentsByScope = (scopeId?: string) =>
  useQuery({
    queryKey: rbacKeys.assignmentsByScope(scopeId ?? ''),
    queryFn: () => rbacApi.assignments.listByScope(scopeId as string).then((r) => r.data.data ?? []),
    enabled: !!scopeId,
  });

export const useRbacUserEffective = (userId?: string, scopeId?: string) =>
  useQuery({
    queryKey: rbacKeys.effective(userId ?? '', scopeId),
    queryFn: () => rbacApi.users.effective(userId as string, scopeId).then((r) => r.data.data),
    enabled: !!userId,
  });

export const useAssignRbacRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignRolePayload) => rbacApi.assignments.create(payload),
    onSuccess: (_res, payload) => {
      qc.invalidateQueries({ queryKey: rbacKeys.assignmentsByScope(payload.scopeId) });
      qc.invalidateQueries({ queryKey: rbacKeys.all });
      toast.success('Role assigned');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useRevokeRbacAssignment = (scopeId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rbacApi.assignments.revoke(id),
    onSuccess: () => {
      if (scopeId) qc.invalidateQueries({ queryKey: rbacKeys.assignmentsByScope(scopeId) });
      qc.invalidateQueries({ queryKey: rbacKeys.all });
      toast.success('Role revoked');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
