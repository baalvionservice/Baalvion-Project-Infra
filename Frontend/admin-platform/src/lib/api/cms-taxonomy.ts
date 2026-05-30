import { cmsApiClient } from './client';
import { useCmsStore } from '@/lib/store/cmsStore';
import type {
  WebsiteCategory,
  WebsiteTag,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  ReorderCategoryPayload,
  CreateTagPayload,
} from '@/lib/types/cms-taxonomy.types';
import type { ApiResponse } from '@/lib/types/common.types';

// Website-scoped taxonomy on cms-service. Backend uses `sortOrder`; console uses `order`.
const wid = (): string => {
  const id = useCmsStore.getState().activeWebsiteId;
  if (!id) throw new Error('No active website selected');
  return id;
};

interface RawCategory {
  id: string; websiteId: string; parentId: string | null; name: string; slug: string;
  description?: string | null; sortOrder?: number; depth?: number; contentCount?: number;
  createdAt: string; updatedAt: string;
}

const toCategory = (c: RawCategory): WebsiteCategory => ({
  id: c.id, websiteId: c.websiteId, name: c.name, slug: c.slug,
  description: c.description ?? undefined, parentId: c.parentId ?? null,
  depth: c.depth ?? 0, order: c.sortOrder ?? 0, contentCount: c.contentCount ?? 0,
  createdAt: c.createdAt, updatedAt: c.updatedAt,
});

export const cmsTaxonomyApi = {
  categories: {
    list: async (websiteId: string) => {
      const res = await cmsApiClient.get<ApiResponse<RawCategory[]>>(`/cms/websites/${websiteId}/categories`);
      const items = (res.data.data ?? []).map(toCategory);
      return { ...res, data: { ...res.data, data: items } };
    },

    get: async (id: string) => {
      const res = await cmsApiClient.get<ApiResponse<RawCategory[]>>(`/cms/websites/${wid()}/categories`);
      const found = (res.data.data ?? []).find((c) => c.id === id);
      return { ...res, data: { ...res.data, data: found ? toCategory(found) : null } };
    },

    create: async (payload: CreateCategoryPayload) => {
      const websiteId = payload.websiteId || wid();
      const res = await cmsApiClient.post<ApiResponse<RawCategory>>(`/cms/websites/${websiteId}/categories`, {
        name: payload.name, slug: payload.slug,
        ...(payload.parentId ? { parentId: payload.parentId } : {}),
        ...(payload.description ? { description: payload.description } : {}),
        ...(payload.order !== undefined ? { sortOrder: payload.order } : {}),
      });
      return { ...res, data: { ...res.data, data: toCategory(res.data.data) } };
    },

    update: async (id: string, payload: UpdateCategoryPayload) => {
      const res = await cmsApiClient.patch<ApiResponse<RawCategory>>(`/cms/websites/${wid()}/categories/${id}`, {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.parentId !== undefined ? { parentId: payload.parentId } : {}),
        ...(payload.order !== undefined ? { sortOrder: payload.order } : {}),
      });
      return { ...res, data: { ...res.data, data: toCategory(res.data.data) } };
    },

    delete: (id: string) =>
      cmsApiClient.delete<ApiResponse<void>>(`/cms/websites/${wid()}/categories/${id}`),

    reorder: (websiteId: string, payload: ReorderCategoryPayload) =>
      cmsApiClient.post<ApiResponse<void>>(`/cms/websites/${websiteId}/categories/reorder`, {
        order: payload.items.map((i) => ({ id: i.id, sortOrder: i.order })),
      }),
  },

  tags: {
    list: (websiteId: string) =>
      cmsApiClient.get<ApiResponse<WebsiteTag[]>>(`/cms/websites/${websiteId}/tags`),

    create: (payload: CreateTagPayload) =>
      cmsApiClient.post<ApiResponse<WebsiteTag>>(`/cms/websites/${payload.websiteId || wid()}/tags`, {
        name: payload.name, slug: payload.slug,
      }),

    delete: (id: string) =>
      cmsApiClient.delete<ApiResponse<void>>(`/cms/websites/${wid()}/tags/${id}`),
  },
};
