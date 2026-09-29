import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cmsTaxonomyApi } from '@/lib/api/cms-taxonomy';
import { buildCategoryTree } from '@/lib/types/cms-taxonomy.types';
import type {
  CreateCategoryPayload,
  UpdateCategoryPayload,
  ReorderCategoryPayload,
  CreateTagPayload,
} from '@/lib/types/cms-taxonomy.types';

export const taxonomyKeys = {
  all: ['cms', 'taxonomy'] as const,
  categories: (websiteId: string) => [...taxonomyKeys.all, 'categories', websiteId] as const,
  tags: (websiteId: string) => [...taxonomyKeys.all, 'tags', websiteId] as const,
};

export const useWebsiteCategories = (websiteId: string) =>
  useQuery({
    queryKey: taxonomyKeys.categories(websiteId),
    queryFn: () =>
      cmsTaxonomyApi.categories.list(websiteId).then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 5 * 60_000,
  });

export const useWebsiteCategoryTree = (websiteId: string) =>
  useQuery({
    queryKey: [...taxonomyKeys.categories(websiteId), 'tree'],
    queryFn: () =>
      cmsTaxonomyApi.categories.list(websiteId).then((r) => buildCategoryTree(r.data.data)),
    enabled: !!websiteId,
    staleTime: 5 * 60_000,
  });

export const useWebsiteTags = (websiteId: string) =>
  useQuery({
    queryKey: taxonomyKeys.tags(websiteId),
    queryFn: () => cmsTaxonomyApi.tags.list(websiteId).then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 5 * 60_000,
  });

export const useCreateCategory = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => cmsTaxonomyApi.categories.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxonomyKeys.categories(websiteId) });
      toast.success('Category created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateCategory = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      cmsTaxonomyApi.categories.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxonomyKeys.categories(websiteId) });
      toast.success('Category updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteCategory = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsTaxonomyApi.categories.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxonomyKeys.categories(websiteId) });
      toast.success('Category deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useReorderCategories = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReorderCategoryPayload) =>
      cmsTaxonomyApi.categories.reorder(websiteId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxonomyKeys.categories(websiteId) });
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useCreateTag = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTagPayload) => cmsTaxonomyApi.tags.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxonomyKeys.tags(websiteId) });
      toast.success('Tag created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteTag = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsTaxonomyApi.tags.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxonomyKeys.tags(websiteId) });
      toast.success('Tag deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
