import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { commerceProductsApi } from '@/lib/api/commerce-products';
import type { PaginationParams } from '@/lib/types/common.types';
import type { CreateProductPayload, ProductVariant } from '@/lib/types/commerce.types';

export const productKeys = {
  all: (storeId: string) => ['commerce', storeId, 'products'] as const,
  list: (storeId: string, p?: Record<string, unknown>) => ['commerce', storeId, 'products', 'list', p] as const,
  detail: (storeId: string, id: string) => ['commerce', storeId, 'products', 'detail', id] as const,
  variants: (storeId: string, productId: string) => ['commerce', storeId, 'products', productId, 'variants'] as const,
};

export const useProducts = (
  storeId: string,
  params?: PaginationParams & { status?: string; productType?: string; categoryId?: string; isFeatured?: boolean }
) =>
  useQuery({
    queryKey: productKeys.list(storeId, params),
    queryFn: () => commerceProductsApi.list(storeId, params).then((r) => r.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useProduct = (storeId: string, productId: string) =>
  useQuery({
    queryKey: productKeys.detail(storeId, productId),
    queryFn: () => commerceProductsApi.get(storeId, productId).then((r) => r.data.data),
    enabled: !!storeId && !!productId,
  });

export const useCreateProduct = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => commerceProductsApi.create(storeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all(storeId) });
      toast.success('Product created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateProduct = (storeId: string, productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateProductPayload>) =>
      commerceProductsApi.update(storeId, productId, payload),
    onSuccess: (res) => {
      qc.setQueryData(productKeys.detail(storeId, productId), res.data.data);
      qc.invalidateQueries({ queryKey: productKeys.all(storeId) });
      toast.success('Product updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteProduct = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => commerceProductsApi.delete(storeId, productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all(storeId) });
      toast.success('Product deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const usePublishProduct = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => commerceProductsApi.publish(storeId, productId),
    onSuccess: (_, productId) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(storeId, productId) });
      qc.invalidateQueries({ queryKey: productKeys.all(storeId) });
      toast.success('Product published');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDuplicateProduct = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => commerceProductsApi.duplicate(storeId, productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all(storeId) });
      toast.success('Product duplicated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useBulkUpdateProducts = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { ids: string[]; action: 'publish' | 'archive' | 'delete' | 'assign_category'; categoryId?: string }) =>
      commerceProductsApi.bulkUpdate(storeId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: productKeys.all(storeId) });
      toast.success(`${vars.ids.length} products updated`);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

// Variants

export const useVariants = (storeId: string, productId: string) =>
  useQuery({
    queryKey: productKeys.variants(storeId, productId),
    queryFn: () => commerceProductsApi.variants.list(storeId, productId).then((r) => r.data.data),
    enabled: !!storeId && !!productId,
  });

export const useCreateVariant = (storeId: string, productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProductVariant>) =>
      commerceProductsApi.variants.create(storeId, productId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.variants(storeId, productId) });
      toast.success('Variant created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateVariant = (storeId: string, productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, payload }: { variantId: string; payload: Partial<ProductVariant> }) =>
      commerceProductsApi.variants.update(storeId, productId, variantId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.variants(storeId, productId) });
      toast.success('Variant updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteVariant = (storeId: string, productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) =>
      commerceProductsApi.variants.delete(storeId, productId, variantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.variants(storeId, productId) });
      toast.success('Variant deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
