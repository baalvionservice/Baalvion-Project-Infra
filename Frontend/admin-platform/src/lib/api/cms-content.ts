import { cmsApiClient } from './client';
import { useCmsStore } from '@/lib/store/cmsStore';
import type {
  ContentItem,
  ContentRevision,
  CreateContentPayload,
  UpdateContentPayload,
  ContentListParams,
} from '@/lib/types/cms-content.types';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/common.types';

// cms-service is website-scoped: /cms/websites/:websiteId/content/... . The console's
// content layer is flat-by-id, so id-only methods resolve the active website from the
// cms store (set by the website's content/editor pages). Field names are normalized
// between the camelCase backend (contentType/contentBlocks/seoMetadata/categoryId) and
// the console's ContentItem (type/blocks/seo/categoryIds).

const wid = (): string => {
  const id = useCmsStore.getState().activeWebsiteId;
  if (!id) throw new Error('No active website selected');
  return id;
};

interface RawContent {
  id: string; websiteId: string; categoryId: string | null; categoryIds?: string[]; authorId: string | number;
  lastEditedBy?: string | number | null; title: string; slug: string; excerpt?: string | null;
  featuredImage?: string | null; contentType: ContentItem['type']; contentBlocks?: unknown[];
  tagIds?: string[]; seoMetadata?: Record<string, unknown>; status: ContentItem['status'];
  visibility?: string; scheduledAt?: string | null; publishedAt?: string | null;
  viewCount?: string | number; revisionCount?: number; customFields?: Record<string, unknown>; createdAt: string; updatedAt: string;
}

const author = (id: string | number | null | undefined) =>
  ({ id: Number(id ?? 0), fullName: '', avatarUrl: null });

const toContentItem = (r: RawContent): ContentItem => ({
  id: r.id,
  websiteId: r.websiteId,
  type: r.contentType,
  title: r.title,
  slug: r.slug,
  excerpt: r.excerpt ?? undefined,
  featuredImage: r.featuredImage ?? undefined,
  status: r.status,
  blocks: (r.contentBlocks ?? []) as ContentItem['blocks'],
  seo: (r.seoMetadata ?? {}) as ContentItem['seo'],
  categoryIds:
    Array.isArray(r.categoryIds) && r.categoryIds.length
      ? r.categoryIds
      : r.categoryId
        ? [r.categoryId]
        : [],
  tagIds: r.tagIds ?? [],
  author: author(r.authorId),
  lastEditedBy: r.lastEditedBy ? author(r.lastEditedBy) : undefined,
  publishedAt: r.publishedAt ?? null,
  scheduledAt: r.scheduledAt ?? null,
  viewCount: Number(r.viewCount ?? 0),
  revisionCount: r.revisionCount ?? 0,
  customFields: (r.customFields ?? {}) as Record<string, unknown>,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

// Map console payloads → backend field names. Drop empty featuredImage (backend requires a URL).
const toCreateBody = (p: CreateContentPayload) => ({
  title: p.title,
  slug: p.slug,
  contentType: p.type,
  ...(p.excerpt ? { excerpt: p.excerpt } : {}),
  ...(p.featuredImage ? { featuredImage: p.featuredImage } : {}),
  ...(p.blocks ? { contentBlocks: p.blocks } : {}),
  ...(p.tagIds ? { tagIds: p.tagIds } : {}),
  ...(p.seo ? { seoMetadata: p.seo } : {}),
  ...(p.categoryIds ? { categoryIds: p.categoryIds } : {}),
  ...(p.scheduledAt ? { scheduledAt: p.scheduledAt } : {}),
  ...(p.customFields ? { customFields: p.customFields } : {}),
});

const toUpdateBody = (p: UpdateContentPayload) => ({
  ...(p.title !== undefined ? { title: p.title } : {}),
  ...(p.slug !== undefined ? { slug: p.slug } : {}),
  ...(p.excerpt !== undefined ? { excerpt: p.excerpt } : {}),
  ...(p.featuredImage ? { featuredImage: p.featuredImage } : {}),
  ...(p.blocks !== undefined ? { contentBlocks: p.blocks } : {}),
  ...(p.tagIds !== undefined ? { tagIds: p.tagIds } : {}),
  ...(p.seo !== undefined ? { seoMetadata: p.seo } : {}),
  ...(p.categoryIds !== undefined ? { categoryIds: p.categoryIds } : {}),
  ...(p.scheduledAt !== undefined ? { scheduledAt: p.scheduledAt } : {}),
  ...(p.customFields !== undefined ? { customFields: p.customFields } : {}),
});

export const cmsContentApi = {
  list: async (params: ContentListParams) => {
    const { websiteId, type, ...rest } = params;
    const res = await cmsApiClient.get<PaginatedResponse<RawContent>>(
      `/cms/websites/${websiteId}/content`,
      { params: { ...rest, ...(type ? { contentType: type } : {}) } },
    );
    const items = (res.data.data ?? []).map(toContentItem);
    return { ...res, data: { ...res.data, data: items } as PaginatedResponse<ContentItem> };
  },

  get: async (id: string) => {
    const res = await cmsApiClient.get<ApiResponse<RawContent>>(`/cms/websites/${wid()}/content/${id}`);
    return { ...res, data: { ...res.data, data: toContentItem(res.data.data) } };
  },

  create: async (payload: CreateContentPayload) => {
    const res = await cmsApiClient.post<ApiResponse<RawContent>>(
      `/cms/websites/${payload.websiteId}/content`, toCreateBody(payload),
    );
    return { ...res, data: { ...res.data, data: toContentItem(res.data.data) } };
  },

  update: async (id: string, payload: UpdateContentPayload) => {
    const res = await cmsApiClient.patch<ApiResponse<RawContent>>(
      `/cms/websites/${wid()}/content/${id}`, toUpdateBody(payload),
    );
    return { ...res, data: { ...res.data, data: toContentItem(res.data.data) } };
  },

  delete: (id: string) =>
    cmsApiClient.delete<ApiResponse<void>>(`/cms/websites/${wid()}/content/${id}`),

  duplicate: async (id: string) => {
    // cms-service has no duplicate endpoint — clone via get + create.
    const websiteId = wid();
    const src = await cmsApiClient.get<ApiResponse<RawContent>>(`/cms/websites/${websiteId}/content/${id}`);
    const s = src.data.data;
    const res = await cmsApiClient.post<ApiResponse<RawContent>>(`/cms/websites/${websiteId}/content`, {
      title: `${s.title} (Copy)`,
      slug: `${s.slug}-copy-${Date.now().toString(36)}`,
      contentType: s.contentType,
      ...(s.excerpt ? { excerpt: s.excerpt } : {}),
      ...(Array.isArray(s.contentBlocks) ? { contentBlocks: s.contentBlocks } : {}),
      ...(s.categoryId ? { categoryId: s.categoryId } : {}),
    });
    return { ...res, data: { ...res.data, data: toContentItem(res.data.data) } };
  },

  // Revisions
  revisions: {
    list: (contentId: string) =>
      cmsApiClient.get<ApiResponse<ContentRevision[]>>(`/cms/websites/${wid()}/content/${contentId}/revisions`),

    get: (contentId: string, revisionId: string) =>
      cmsApiClient.get<ApiResponse<ContentRevision>>(`/cms/websites/${wid()}/content/${contentId}/revisions/${revisionId}`),

    restore: async (contentId: string, revisionId: string) => {
      const res = await cmsApiClient.post<ApiResponse<RawContent>>(
        `/cms/websites/${wid()}/content/${contentId}/revisions/${revisionId}/restore`,
      );
      return { ...res, data: { ...res.data, data: toContentItem(res.data.data) } };
    },
  },

  // Autosave (PUT)
  autosave: (id: string, payload: UpdateContentPayload) =>
    cmsApiClient.put<ApiResponse<{ savedAt: string }>>(
      `/cms/websites/${wid()}/content/${id}/autosave`,
      { ...(payload.title !== undefined ? { title: payload.title } : {}), ...(payload.blocks !== undefined ? { contentBlocks: payload.blocks } : {}), ...(payload.excerpt !== undefined ? { excerpt: payload.excerpt } : {}), ...(payload.seo !== undefined ? { seoMetadata: payload.seo } : {}) },
    ),

  // Bulk
  bulkUpdateStatus: (ids: string[], status: string) =>
    cmsApiClient.post<ApiResponse<void>>(`/cms/websites/${wid()}/content/bulk`, { ids, action: status }),

  bulkDelete: (ids: string[]) =>
    cmsApiClient.post<ApiResponse<void>>(`/cms/websites/${wid()}/content/bulk`, { ids, action: 'delete' }),
};
