import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cmsApi } from '@/lib/api/cms';
import type { PaginationParams } from '@/lib/types/common.types';
import type { CreatePagePayload, CreatePostPayload } from '@/lib/types/cms.types';

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
    queryFn: () => cmsApi.pages.list(params).then((r) => r.data),
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
    queryFn: () => cmsApi.posts.list(params).then((r) => r.data),
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
    mutationFn: (id: number) => cmsApi.pages.publish(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: cmsKeys.pages.detail(id) });
      qc.invalidateQueries({ queryKey: ['cms', 'pages'] });
      toast.success('Page published');
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
