import { cmsApiClient } from './client';
import type {
  Website,
  WebsiteStats,
  WebsiteMember,
  CreateWebsitePayload,
  UpdateWebsitePayload,
  AddWebsiteMemberPayload,
} from '@/lib/types/cms-website.types';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/common.types';

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
  members: {
    list: (websiteId: string) =>
      cmsApiClient.get<ApiResponse<WebsiteMember[]>>(`/cms/websites/${websiteId}/members`),

    add: (websiteId: string, payload: AddWebsiteMemberPayload) =>
      cmsApiClient.post<ApiResponse<WebsiteMember>>(`/cms/websites/${websiteId}/members`, payload),

    updateRole: (websiteId: string, userId: number, cmsRole: string) =>
      cmsApiClient.patch<ApiResponse<WebsiteMember>>(`/cms/websites/${websiteId}/members/${userId}`, { role: cmsRole }),

    remove: (websiteId: string, userId: number) =>
      cmsApiClient.delete<ApiResponse<void>>(`/cms/websites/${websiteId}/members/${userId}`),
  },
};
