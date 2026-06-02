import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productMediaApi, type UploadMediaFields } from '@/lib/api/product-media';

export const productMediaKeys = {
  all: (storeId: string, productId: string) =>
    ['commerce', storeId, 'products', productId, 'media'] as const,
};

export const useProductMedia = (storeId: string, productId: string) =>
  useQuery({
    queryKey: productMediaKeys.all(storeId, productId),
    queryFn: () => productMediaApi.list(storeId, productId).then((r) => r.data.data),
    enabled: !!storeId && !!productId,
  });

export const useUploadProductMedia = (storeId: string, productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, fields, onProgress }: { file: File; fields?: UploadMediaFields; onProgress?: (pct: number) => void }) =>
      productMediaApi.upload(storeId, productId, file, fields, onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productMediaKeys.all(storeId, productId) });
      toast.success('Image uploaded');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useReplaceProductMedia = (storeId: string, productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mediaId, file }: { mediaId: string; file: File }) =>
      productMediaApi.replace(storeId, productId, mediaId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productMediaKeys.all(storeId, productId) });
      toast.success('Image replaced');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateProductMedia = (storeId: string, productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mediaId, payload }: { mediaId: string; payload: { altText?: string | null; isFeatured?: boolean } }) =>
      productMediaApi.update(storeId, productId, mediaId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productMediaKeys.all(storeId, productId) });
      toast.success('Image updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useFeatureProductMedia = (storeId: string, productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) => productMediaApi.setFeatured(storeId, productId, mediaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productMediaKeys.all(storeId, productId) });
      toast.success('Featured image set');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useReorderProductMedia = (storeId: string, productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => productMediaApi.reorder(storeId, productId, orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: productMediaKeys.all(storeId, productId) }),
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteProductMedia = (storeId: string, productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) => productMediaApi.remove(storeId, productId, mediaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productMediaKeys.all(storeId, productId) });
      toast.success('Image deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
