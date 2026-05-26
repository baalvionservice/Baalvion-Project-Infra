import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { commerceStoresApi } from '@/lib/api/commerce-stores';
import { useCommerceStore } from '@/lib/store/commerceStore';
import type { PaginationParams } from '@/lib/types/common.types';
import type { CreateStorePayload, CreateDiscountPayload, CommerceCategory } from '@/lib/types/commerce.types';

export const commerceKeys = {
  stores: {
    all: ['commerce', 'stores'] as const,
    list: (p?: Record<string, unknown>) => ['commerce', 'stores', 'list', p] as const,
    detail: (id: string) => ['commerce', 'stores', 'detail', id] as const,
  },
  categories: (storeId: string) => ['commerce', storeId, 'categories'] as const,
  discounts: {
    list: (storeId: string, p?: Record<string, unknown>) => ['commerce', storeId, 'discounts', p] as const,
  },
  collections: {
    list: (storeId: string, p?: Record<string, unknown>) => ['commerce', storeId, 'collections', p] as const,
  },
};

export const useCommerceStores = (params?: PaginationParams & { status?: string }) =>
  useQuery({
    queryKey: commerceKeys.stores.list(params),
    queryFn: () => commerceStoresApi.stores.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useCommerceStoreDetail = (storeId: string) =>
  useQuery({
    queryKey: commerceKeys.stores.detail(storeId),
    queryFn: () => commerceStoresApi.stores.get(storeId).then((r) => r.data.data),
    enabled: !!storeId,
  });

export const useCreateCommerceStore = () => {
  const qc = useQueryClient();
  const setActiveStore = useCommerceStore((s) => s.setActiveStore);
  return useMutation({
    mutationFn: (payload: CreateStorePayload) => commerceStoresApi.stores.create(payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: commerceKeys.stores.all });
      setActiveStore(res.data.data);
      toast.success('Store created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateCommerceStore = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateStorePayload>) => commerceStoresApi.stores.update(storeId, payload),
    onSuccess: (res) => {
      qc.setQueryData(commerceKeys.stores.detail(storeId), res.data.data);
      qc.invalidateQueries({ queryKey: commerceKeys.stores.all });
      toast.success('Store updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteCommerceStore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commerceStoresApi.stores.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commerceKeys.stores.all });
      toast.success('Store deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

// Categories

export const useCommerceCategories = (storeId: string) =>
  useQuery({
    queryKey: commerceKeys.categories(storeId),
    queryFn: () => commerceStoresApi.categories.list(storeId).then((r) => r.data.data),
    enabled: !!storeId,
    staleTime: 5 * 60_000,
  });

export const useCreateCategory = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; parentId?: string; description?: string; sortOrder?: number }) =>
      commerceStoresApi.categories.create(storeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commerceKeys.categories(storeId) });
      toast.success('Category created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateCategory = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: string; payload: Partial<CommerceCategory> }) =>
      commerceStoresApi.categories.update(storeId, categoryId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commerceKeys.categories(storeId) });
      toast.success('Category updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteCategory = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => commerceStoresApi.categories.delete(storeId, categoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commerceKeys.categories(storeId) });
      toast.success('Category deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useReorderCategories = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: Array<{ id: string; sortOrder: number }>) =>
      commerceStoresApi.categories.reorder(storeId, order),
    onSuccess: () => qc.invalidateQueries({ queryKey: commerceKeys.categories(storeId) }),
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

// Discounts

export const useDiscounts = (storeId: string, params?: PaginationParams & { isActive?: boolean }) =>
  useQuery({
    queryKey: commerceKeys.discounts.list(storeId, params),
    queryFn: () => commerceStoresApi.discounts.list(storeId, params).then((r) => r.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useCreateDiscount = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDiscountPayload) => commerceStoresApi.discounts.create(storeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commerce', storeId, 'discounts'] });
      toast.success('Discount created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateDiscount = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ discountId, payload }: { discountId: string; payload: Partial<CreateDiscountPayload> }) =>
      commerceStoresApi.discounts.update(storeId, discountId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commerce', storeId, 'discounts'] });
      toast.success('Discount updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteDiscount = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (discountId: string) => commerceStoresApi.discounts.delete(storeId, discountId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commerce', storeId, 'discounts'] });
      toast.success('Discount deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

// Collections

export const useCollections = (storeId: string, params?: PaginationParams) =>
  useQuery({
    queryKey: commerceKeys.collections.list(storeId, params),
    queryFn: () => commerceStoresApi.collections.list(storeId, params).then((r) => r.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });
