import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { organizationsApi } from '@/lib/api/organizations';
import type { PaginationParams } from '@/lib/types/common.types';
import type { CreateOrgPayload, InviteMemberPayload } from '@/lib/types/organization.types';

export const orgKeys = {
  all: ['organizations'] as const,
  list: (p?: PaginationParams) => [...orgKeys.all, 'list', p] as const,
  detail: (id: string) => [...orgKeys.all, 'detail', id] as const,
  members: (id: string) => [...orgKeys.all, 'members', id] as const,
  invitations: (id: string) => [...orgKeys.all, 'invitations', id] as const,
};

export const useOrganizations = (params?: PaginationParams & { plan?: string; status?: string }) =>
  useQuery({
    queryKey: orgKeys.list(params),
    queryFn: () => organizationsApi.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useOrganization = (id: string) =>
  useQuery({
    queryKey: orgKeys.detail(id),
    queryFn: () => organizationsApi.get(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useOrgMembers = (orgId: string) =>
  useQuery({
    queryKey: orgKeys.members(orgId),
    queryFn: () => organizationsApi.members(orgId).then((r) => r.data.data),
    enabled: !!orgId,
  });

export const useOrgInvitations = (orgId: string) =>
  useQuery({
    queryKey: orgKeys.invitations(orgId),
    queryFn: () => organizationsApi.invitations(orgId).then((r) => r.data.data),
    enabled: !!orgId,
  });

export const useCreateOrg = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrgPayload) => organizationsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.all });
      toast.success('Organization created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useInviteMember = (orgId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteMemberPayload) => organizationsApi.invite(orgId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.invitations(orgId) });
      toast.success('Invitation sent');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useRemoveMember = (orgId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => organizationsApi.removeMember(orgId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.members(orgId) });
      toast.success('Member removed');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
