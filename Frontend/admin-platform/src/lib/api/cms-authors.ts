import { cmsApiClient } from './client';
import { useCmsStore } from '@/lib/store/cmsStore';
import type {
  WebsiteAuthor,
  CreateAuthorPayload,
  UpdateAuthorPayload,
} from '@/lib/types/cms-authors.types';
import type { ApiResponse } from '@/lib/types/common.types';

// Website-scoped author/contributor profiles on cms-service.
const wid = (): string => {
  const id = useCmsStore.getState().activeWebsiteId;
  if (!id) throw new Error('No active website selected');
  return id;
};

export const cmsAuthorsApi = {
  list: (websiteId: string) =>
    cmsApiClient.get<ApiResponse<WebsiteAuthor[]>>(`/cms/websites/${websiteId}/authors`),

  create: (payload: CreateAuthorPayload) => {
    const websiteId = payload.websiteId || wid();
    return cmsApiClient.post<ApiResponse<WebsiteAuthor>>(`/cms/websites/${websiteId}/authors`, {
      name: payload.name,
      ...(payload.slug ? { slug: payload.slug } : {}),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.credentials !== undefined ? { credentials: payload.credentials } : {}),
      ...(payload.bio !== undefined ? { bio: payload.bio } : {}),
      ...(payload.avatarUrl !== undefined ? { avatarUrl: payload.avatarUrl } : {}),
      ...(payload.expertise ? { expertise: payload.expertise } : {}),
      ...(payload.social ? { social: payload.social } : {}),
      ...(payload.seoMetadata ? { seoMetadata: payload.seoMetadata } : {}),
      ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
    });
  },

  update: (id: string, payload: UpdateAuthorPayload) =>
    cmsApiClient.patch<ApiResponse<WebsiteAuthor>>(`/cms/websites/${wid()}/authors/${id}`, {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.credentials !== undefined ? { credentials: payload.credentials } : {}),
      ...(payload.bio !== undefined ? { bio: payload.bio } : {}),
      ...(payload.avatarUrl !== undefined ? { avatarUrl: payload.avatarUrl } : {}),
      ...(payload.expertise !== undefined ? { expertise: payload.expertise } : {}),
      ...(payload.social !== undefined ? { social: payload.social } : {}),
      ...(payload.seoMetadata !== undefined ? { seoMetadata: payload.seoMetadata } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
    }),

  delete: (id: string) =>
    cmsApiClient.delete<ApiResponse<void>>(`/cms/websites/${wid()}/authors/${id}`),
};
