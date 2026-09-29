import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cmsApi } from '@/lib/api/cms';
import { cmsContentApi } from '@/lib/api/cms-content';
import { websitesApi } from '@/lib/api/cms-websites';
import { cmsWorkflowApi } from '@/lib/api/cms-workflow';
import { useCmsStore } from '@/lib/store/cmsStore';
import type { PaginationParams } from '@/lib/types/common.types';
import type { CreatePagePayload, CreatePostPayload } from '@/lib/types/cms.types';
import type { ContentItem, ContentItemType } from '@/lib/types/cms-content.types';

/**
 * Aggregate real CMS content across every website (cms-service is website-scoped; the flat
 * Pages/Posts console shows a cross-site view from the live delivery API). Each row is tagged
 * with its website name + id so row actions can deep-link into the per-site content console.
 */
export type AggregatedContent = ContentItem & { websiteName: string };

async function aggregateContent(type: ContentItemType, status?: string) {
  const sitesRes = await websitesApi.list({ limit: 100 });
  const sites = sitesRes.data.data ?? [];
  const perSite = await Promise.all(
    sites.map((w: { id: string; name: string }) =>
      cmsContentApi
        .list({ websiteId: w.id, type, ...(status ? { status } : {}), limit: 100 } as Parameters<typeof cmsContentApi.list>[0])
        .then((r) => (r.data.data ?? []).map((c): AggregatedContent => ({ ...c, websiteName: w.name })))
        .catch(() => [] as AggregatedContent[]),
    ),
  );
  const items = perSite.flat().sort((a: AggregatedContent, b: AggregatedContent) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return { data: items, pagination: { total: items.length, page: 1, limit: items.length || 1, totalPages: 1 } };
}

export const cmsKeys = {
  pages: {
    list: (p?: PaginationParams) => ['cms', 'pages', 'list', p] as const,
    detail: (id: number) => ['cms', 'pages', 'detail', id] as const,
  },
  posts: {
    list: (p?: PaginationParams) => ['cms', 'posts', 'list', p] as const,
    detail: (id: number) => ['cms', 'posts', 'detail', id] as const,
  },
  categories: () => ['cms', 'categories'] as const,
  tags: () => ['cms', 'tags'] as const,
};

export const useCmsPages = (params?: PaginationParams & { status?: string }) =>
  useQuery({
    queryKey: cmsKeys.pages.list(params),
    queryFn: () => aggregateContent('page', params?.status),
    placeholderData: keepPreviousData,
  });

export const useCmsPage = (id: number) =>
  useQuery({
    queryKey: cmsKeys.pages.detail(id),
    queryFn: () => cmsApi.pages.get(id).then((r) => r.data.data),
    enabled: id > 0,
  });

export const useCmsPosts = (params?: PaginationParams & { status?: string }) =>
  useQuery({
    queryKey: cmsKeys.posts.list(params),
    queryFn: () => aggregateContent('post', params?.status),
    placeholderData: keepPreviousData,
  });

export const useCategories = () =>
  useQuery({
    queryKey: cmsKeys.categories(),
    queryFn: () => cmsApi.categories.list().then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

export const useTags = () =>
  useQuery({
    queryKey: cmsKeys.tags(),
    queryFn: () => cmsApi.tags.list().then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

export const useCreatePage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePagePayload) => cmsApi.pages.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms', 'pages'] });
      toast.success('Page created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const usePublishPage = () => {
  const qc = useQueryClient();
  return useMutation({
    // Publish via the real cms-service workflow transition (website-scoped). The transition client
    // reads the active website from the cms store, so set it from the item being published.
    mutationFn: ({ websiteId, id }: { websiteId: string; id: string }) => {
      useCmsStore.getState().setActiveWebsiteId(websiteId);
      return cmsWorkflowApi.transition({ contentId: id, action: 'publish' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms', 'pages'] });
      qc.invalidateQueries({ queryKey: ['cms', 'posts'] });
      toast.success('Published');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePostPayload) => cmsApi.posts.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms', 'posts'] });
      toast.success('Post created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
