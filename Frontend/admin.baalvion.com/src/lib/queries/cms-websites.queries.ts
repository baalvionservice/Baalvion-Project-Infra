import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { websitesApi } from '@/lib/api/cms-websites';
import { useCmsStore } from '@/lib/store/cmsStore';
import type {
  CreateWebsitePayload,
  UpdateWebsitePayload,
  AddWebsiteMemberPayload,
  CmsRole,
  GrantSiteAccessPayload,
} from '@/lib/types/cms-website.types';

export const websiteKeys = {
  all: ['cms', 'websites'] as const,
  list: (params?: Record<string, unknown>) => [...websiteKeys.all, 'list', params] as const,
  detail: (id: string) => [...websiteKeys.all, 'detail', id] as const,
  stats: (id: string) => [...websiteKeys.all, 'stats', id] as const,
  members: (id: string) => [...websiteKeys.all, 'members', id] as const,
  invitations: (id: string) => [...websiteKeys.all, 'invitations', id] as const,
};

export const useWebsites = (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
  useQuery({
    queryKey: websiteKeys.list(params),
    queryFn: () => websitesApi.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useWebsite = (id: string) =>
  useQuery({
    queryKey: websiteKeys.detail(id),
    queryFn: () => websitesApi.get(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useWebsiteStats = (id: string) =>
  useQuery({
    queryKey: websiteKeys.stats(id),
    queryFn: () => websitesApi.stats(id).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 2 * 60_000,
  });

export const useWebsiteMembers = (websiteId: string) =>
  useQuery({
    queryKey: websiteKeys.members(websiteId),
    queryFn: () => websitesApi.members.list(websiteId).then((r) => r.data.data),
    enabled: !!websiteId,
  });

export const useWebsiteInvitations = (websiteId: string) =>
  useQuery({
    queryKey: websiteKeys.invitations(websiteId),
    queryFn: () => websitesApi.invitations.list(websiteId).then((r) => r.data.data),
    enabled: !!websiteId,
  });

/**
 * Grant one person access to several websites at once.
 *
 * The result is deliberately mixed — a person may be added to sites they already have an
 * account for, invited by email to others, and skipped on any where they are already a
 * member. The toast reports each outcome rather than claiming a flat success.
 */
/**
 * Site grants for a specific set of people — the access half of the People view.
 *
 * Scoped to the visible page rather than fetching every grant on the platform: the query is
 * disabled until there are ids, so it never fires an unbounded request on first render.
 */
export const useSiteGrantsFor = (userIds: number[]) =>
  useQuery({
    queryKey: [...websiteKeys.all, 'grants', userIds],
    queryFn: () => websitesApi.listAllGrants({ userIds }),
    enabled: userIds.length > 0,
    staleTime: 30_000,
  });

/** Every site grant across all websites. Prefer useSiteGrantsFor where a page is known. */
export const useAllSiteGrants = () =>
  useQuery({
    queryKey: [...websiteKeys.all, 'grants', 'all'],
    queryFn: () => websitesApi.listAllGrants(),
    staleTime: 30_000,
  });

/**
 * Remove one person from every website. Reports per-site outcomes rather than a flat success —
 * a partial failure during offboarding is exactly what someone needs to know about.
 */
export const useRevokeAllSiteAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => websitesApi.revokeAllAccess(userId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: websiteKeys.all });
      if (res.revoked.length === 0 && res.failed.length === 0) {
        toast.info('That person had no site access to remove');
      } else if (res.revoked.length) {
        toast.success(`Removed from ${res.revoked.length} site${res.revoked.length > 1 ? 's' : ''}`);
      }
      if (res.failed.length) {
        toast.warning(
          `${res.failed.length} site${res.failed.length > 1 ? 's' : ''} could not be revoked: ${res.failed
            .map((f) => f.websiteName)
            .join(', ')} — they still have access there.`,
        );
      }
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useGrantSiteAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GrantSiteAccessPayload) => websitesApi.grantAccess(payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: websiteKeys.all });

      const parts: string[] = [];
      if (res.granted.length) parts.push(`${res.granted.length} site${res.granted.length > 1 ? 's' : ''} granted`);
      if (res.invited.length) parts.push(`${res.invited.length} invite${res.invited.length > 1 ? 's' : ''} sent`);

      if (parts.length) toast.success(parts.join(' · '));

      // Never swallow a partial failure — the admin needs to know which sites didn't take.
      if (res.skipped.length) {
        toast.warning(
          `${res.skipped.length} site${res.skipped.length > 1 ? 's' : ''} skipped: ${res.skipped
            .map((s) => s.reason)
            .join('; ')}`,
        );
      }
      if (!parts.length && !res.skipped.length) toast.info('No changes were made');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useCreateWebsite = () => {
  const qc = useQueryClient();
  const setActiveWebsite = useCmsStore((s) => s.setActiveWebsite);
  return useMutation({
    mutationFn: (payload: CreateWebsitePayload) => websitesApi.create(payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: websiteKeys.all });
      setActiveWebsite(res.data.data);
      toast.success('Website created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateWebsite = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateWebsitePayload) => websitesApi.update(id, payload),
    onSuccess: (res) => {
      qc.setQueryData(websiteKeys.detail(id), res.data.data);
      qc.invalidateQueries({ queryKey: websiteKeys.all });
      toast.success('Website updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

// Activate/suspend a website. Suspending flips cms-service status to 'inactive',
// which immediately 404s all public content endpoints for that site (see
// publicService._resolveWebsite) — this is the enable/disable kill switch.
export const useToggleWebsiteStatus = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nextStatus: 'active' | 'inactive') =>
      nextStatus === 'active' ? websitesApi.activate(id) : websitesApi.suspend(id),
    onSuccess: (res, nextStatus) => {
      qc.setQueryData(websiteKeys.detail(id), res.data.data);
      qc.invalidateQueries({ queryKey: websiteKeys.all });
      toast.success(nextStatus === 'active' ? 'Website activated' : 'Website disabled');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteWebsite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => websitesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: websiteKeys.all });
      toast.success('Website deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useAddWebsiteMember = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddWebsiteMemberPayload) =>
      websitesApi.members.add(websiteId, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: websiteKeys.members(websiteId) });
      qc.invalidateQueries({ queryKey: websiteKeys.invitations(websiteId) });
      const result = res.data.data;
      if (result.kind === 'member') {
        toast.success('Member added');
      } else if (result.emailSent) {
        toast.success(`Invitation emailed to ${result.email}`);
      } else {
        toast.warning(
          `Invitation created for ${result.email}, but the email could not be sent. Check email delivery, then resend.`,
        );
      }
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useResendWebsiteInvitation = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => websitesApi.invitations.resend(websiteId, invitationId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: websiteKeys.invitations(websiteId) });
      const result = res.data.data;
      if (result.emailSent) {
        toast.success(`Invitation re-sent to ${result.email}`);
      } else {
        toast.warning(`Could not send the invitation email to ${result.email}. Check email delivery.`);
      }
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useRevokeWebsiteInvitation = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => websitesApi.invitations.revoke(websiteId, invitationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: websiteKeys.invitations(websiteId) });
      toast.success('Invitation revoked');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateWebsiteMemberRole = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: CmsRole }) =>
      websitesApi.members.updateRole(websiteId, userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: websiteKeys.members(websiteId) });
      toast.success('Role updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useRemoveWebsiteMember = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => websitesApi.members.remove(websiteId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: websiteKeys.members(websiteId) });
      toast.success('Member removed');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
