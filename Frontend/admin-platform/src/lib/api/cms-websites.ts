import { cmsApiClient } from './client';
import type {
  Website,
  WebsiteStats,
  WebsiteMember,
  CmsRole,
  CreateWebsitePayload,
  UpdateWebsitePayload,
  AddWebsiteMemberPayload,
  AddWebsiteMemberResponse,
  AddWebsiteInvitationResult,
  WebsiteInvitation,
  UserSearchResult,
  GrantSiteAccessPayload,
  GrantSiteAccessResult,
  SiteGrant,
  RevokeAllResult,
} from '@/lib/types/cms-website.types';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/common.types';

/** Wire shape of a grant: BIGINT ids arrive as strings. */
type RawSiteGrant = Omit<SiteGrant, 'id' | 'userId' | 'user'> & {
  id: string | number;
  userId: string | number;
  user: Omit<SiteGrant['user'], 'id'> & { id: string | number };
};

// cms-service stores the CMS role as `role`; the console renders it as `cmsRole`.
interface RawMember {
  id: number;
  websiteId: string;
  userId: number;
  role: CmsRole;
  invitedBy?: number | null;
  joinedAt: string;
  user: { id: number; fullName: string; email: string; avatarUrl: string | null };
}

const toMember = (m: RawMember): WebsiteMember => ({
  id: m.id,
  websiteId: m.websiteId,
  userId: m.userId,
  cmsRole: m.role,
  user: m.user,
  joinedAt: m.joinedAt,
});

// POST /members returns either an immediate grant (existing platform user) or a
// pending invitation (unknown email — accept link emailed to them), tagged by `kind`.
type RawAddMemberResponse = ({ kind: 'member' } & RawMember) | AddWebsiteInvitationResult;

const toAddMemberResult = (r: RawAddMemberResponse): AddWebsiteMemberResponse =>
  r.kind === 'invitation' ? r : { kind: 'member', ...toMember(r) };

// cms-service (:3018 /api/v1) returns camelCase rows. It does not (yet) embed
// content/member counts or a createdBy user object, so we backfill those to the
// Website shape the console renders.
interface RawWebsite {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  domain: string;
  description?: string | null;
  status: Website['status'];
  plan: Website['plan'];
  modules: Website['modules'];
  config?: Partial<Website['config']>;
  branding?: Record<string, unknown> | null;
  contentCount?: number;
  memberCount?: number;
  createdBy?: number | { id: number; fullName: string; avatarUrl: string | null };
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_CONFIG: Website['config'] = {
  defaultLanguage: 'en',
  timezone: 'UTC',
  dateFormat: 'MMM d, yyyy',
  postsPerPage: 10,
  enableComments: false,
  enableAnalytics: true,
  seoDefaults: {},
};

const toWebsite = (w: RawWebsite): Website => ({
  id: w.id,
  orgId: w.organizationId,
  name: w.name,
  slug: w.slug,
  domain: w.domain,
  status: w.status,
  plan: w.plan,
  modules: (w.modules ?? []) as Website['modules'],
  config: { ...DEFAULT_CONFIG, ...(w.config ?? {}) } as Website['config'],
  contentCount: w.contentCount ?? 0,
  memberCount: w.memberCount ?? 0,
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
  createdBy:
    typeof w.createdBy === 'object' && w.createdBy
      ? w.createdBy
      : { id: Number(w.createdBy ?? 0), fullName: '', avatarUrl: null },
});

export const websitesApi = {
  list: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const res = await cmsApiClient.get<PaginatedResponse<RawWebsite>>('/cms/websites', { params });
    const items = (res.data.data ?? []).map(toWebsite);
    return { ...res, data: { ...res.data, data: items } as PaginatedResponse<Website> };
  },

  get: async (id: string) => {
    const res = await cmsApiClient.get<ApiResponse<RawWebsite>>(`/cms/websites/${id}`);
    return { ...res, data: { ...res.data, data: toWebsite(res.data.data) } };
  },

  stats: (id: string) =>
    cmsApiClient.get<ApiResponse<WebsiteStats>>(`/cms/websites/${id}/stats`),

  create: async (payload: CreateWebsitePayload) => {
    const res = await cmsApiClient.post<ApiResponse<RawWebsite>>('/cms/websites', payload);
    return { ...res, data: { ...res.data, data: toWebsite(res.data.data) } };
  },

  update: async (id: string, payload: UpdateWebsitePayload) => {
    const res = await cmsApiClient.patch<ApiResponse<RawWebsite>>(`/cms/websites/${id}`, payload);
    return { ...res, data: { ...res.data, data: toWebsite(res.data.data) } };
  },

  delete: (id: string) =>
    cmsApiClient.delete<ApiResponse<void>>(`/cms/websites/${id}`),

  activate: async (id: string) => {
    const res = await cmsApiClient.patch<ApiResponse<RawWebsite>>(`/cms/websites/${id}`, { status: 'active' });
    return { ...res, data: { ...res.data, data: toWebsite(res.data.data) } };
  },

  suspend: async (id: string) => {
    const res = await cmsApiClient.patch<ApiResponse<RawWebsite>>(`/cms/websites/${id}`, { status: 'inactive' });
    return { ...res, data: { ...res.data, data: toWebsite(res.data.data) } };
  },

  // Members
  /**
   * Every site grant across every website (platform admins only). The staff directory knows
   * departments and the CMS knows site access; this is the half needed to join them.
   */
  listAllGrants: async (params?: { userId?: number; userIds?: number[]; websiteId?: string }) => {
    const res = await cmsApiClient.get<ApiResponse<RawSiteGrant[]>>(
      '/cms/websites/access-grants',
      // userIds goes over the wire comma-separated — annotating one page of people rather
      // than pulling every grant on the platform.
      { params: { ...params, userIds: params?.userIds?.join(',') || undefined } },
    );
    // user_id is a Postgres BIGINT, which serialises as a STRING ("16"), not a number.
    // Left as-is it silently breaks any join keyed on the numeric user id — the values look
    // identical in a log and never match. Coerced here so SiteGrant's declared types are true.
    return (res.data.data ?? []).map<SiteGrant>((g) => ({
      ...g,
      id: Number(g.id),
      userId: Number(g.userId),
      user: { ...g.user, id: Number(g.user.id) },
    }));
  },

  /**
   * Remove one person from EVERY website in a single action (platform admins only).
   * Each site is audited separately, so the trail names exactly what was taken away.
   */
  revokeAllAccess: async (userId: number) => {
    const res = await cmsApiClient.delete<ApiResponse<RevokeAllResult>>(
      '/cms/websites/access-grants',
      { params: { userId } },
    );
    return res.data.data;
  },

  /**
   * Grant one person access to several websites at once (platform admins only).
   * Returns a per-site outcome — some may be granted, some invited, some skipped.
   */
  grantAccess: async (payload: GrantSiteAccessPayload) => {
    const res = await cmsApiClient.post<ApiResponse<GrantSiteAccessResult>>(
      '/websites/access-grants',
      payload,
    );
    return res.data.data;
  },

  members: {
    list: async (websiteId: string) => {
      const res = await cmsApiClient.get<ApiResponse<RawMember[]>>(`/cms/websites/${websiteId}/members`);
      const items = (res.data.data ?? []).map(toMember);
      return { ...res, data: { ...res.data, data: items } as ApiResponse<WebsiteMember[]> };
    },

    add: async (websiteId: string, payload: AddWebsiteMemberPayload) => {
      const res = await cmsApiClient.post<ApiResponse<RawAddMemberResponse>>(`/cms/websites/${websiteId}/members`, payload);
      return { ...res, data: { ...res.data, data: toAddMemberResult(res.data.data) } };
    },

    updateRole: async (websiteId: string, userId: number, cmsRole: CmsRole) => {
      const res = await cmsApiClient.patch<ApiResponse<RawMember>>(`/cms/websites/${websiteId}/members/${userId}`, { role: cmsRole });
      return { ...res, data: { ...res.data, data: toMember(res.data.data) } };
    },

    remove: (websiteId: string, userId: number) =>
      cmsApiClient.delete<ApiResponse<void>>(`/cms/websites/${websiteId}/members/${userId}`),

    searchUsers: (websiteId: string, q: string) =>
      cmsApiClient.get<ApiResponse<UserSearchResult[]>>(`/cms/websites/${websiteId}/members/user-search`, { params: { q } }),
  },

  // Pending contributor invites — the unknown-email path of members.add().
  invitations: {
    list: (websiteId: string) =>
      cmsApiClient.get<ApiResponse<WebsiteInvitation[]>>(`/cms/websites/${websiteId}/invitations`),

    resend: (websiteId: string, invitationId: string) =>
      cmsApiClient.post<ApiResponse<AddWebsiteInvitationResult>>(
        `/cms/websites/${websiteId}/invitations/${invitationId}/resend`,
      ),

    revoke: (websiteId: string, invitationId: string) =>
      cmsApiClient.delete<ApiResponse<void>>(`/cms/websites/${websiteId}/invitations/${invitationId}`),
  },
};
