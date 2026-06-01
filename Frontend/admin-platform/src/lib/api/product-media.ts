import { serviceClients } from './client';
import type { ApiResponse } from '@/lib/types/common.types';
import type { ProductMediaItem, ProductMediaType } from '@/lib/types/commerce.types';

const client = serviceClients.commerce;

const base = (storeId: string, productId: string) =>
  `/commerce/stores/${storeId}/products/${productId}/media`;

export interface UploadMediaFields {
  mediaType?: ProductMediaType;
  altText?: string;
  variantId?: string;
  isFeatured?: boolean;
}

function buildForm(file: File, fields: UploadMediaFields = {}): FormData {
  const fd = new FormData();
  fd.append('file', file);
  if (fields.mediaType) fd.append('mediaType', fields.mediaType);
  if (fields.altText) fd.append('altText', fields.altText);
  if (fields.variantId) fd.append('variantId', fields.variantId);
  if (fields.isFeatured != null) fd.append('isFeatured', String(fields.isFeatured));
  return fd;
}

export const productMediaApi = {
  list: (storeId: string, productId: string) =>
    client.get<ApiResponse<ProductMediaItem[]>>(base(storeId, productId)),

  upload: (
    storeId: string,
    productId: string,
    file: File,
    fields?: UploadMediaFields,
    onProgress?: (pct: number) => void,
  ) =>
    client.post<ApiResponse<ProductMediaItem>>(base(storeId, productId), buildForm(file, fields), {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }),

  replace: (storeId: string, productId: string, mediaId: string, file: File) =>
    client.put<ApiResponse<ProductMediaItem>>(`${base(storeId, productId)}/${mediaId}`, buildForm(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (
    storeId: string,
    productId: string,
    mediaId: string,
    payload: { altText?: string | null; variantId?: string | null; isFeatured?: boolean },
  ) =>
    client.patch<ApiResponse<ProductMediaItem>>(`${base(storeId, productId)}/${mediaId}`, payload),

  setFeatured: (storeId: string, productId: string, mediaId: string) =>
    client.post<ApiResponse<ProductMediaItem[]>>(`${base(storeId, productId)}/${mediaId}/feature`),

  reorder: (storeId: string, productId: string, orderedIds: string[]) =>
    client.post<ApiResponse<ProductMediaItem[]>>(`${base(storeId, productId)}/reorder`, { orderedIds }),

  remove: (storeId: string, productId: string, mediaId: string) =>
    client.delete<ApiResponse<{ id: string; deleted: boolean }>>(`${base(storeId, productId)}/${mediaId}`),
};
