import { cmsApiClient } from './client';
import type { AuthorMessage } from '@/lib/types/cms-author-messages.types';
import type { PaginatedResponse, ApiResponse, PaginationParams } from '@/lib/types/common.types';

// "Contact the Author" submissions from an author's public /authors/[slug] page.
export const cmsAuthorMessagesApi = {
  list: (websiteId: string, params?: PaginationParams) =>
    cmsApiClient.get<PaginatedResponse<AuthorMessage>>(`/cms/websites/${websiteId}/author-messages`, { params }),

  markRead: (websiteId: string, id: string) =>
    cmsApiClient.patch<ApiResponse<AuthorMessage>>(`/cms/websites/${websiteId}/author-messages/${id}/read`),

  markUnread: (websiteId: string, id: string) =>
    cmsApiClient.patch<ApiResponse<AuthorMessage>>(`/cms/websites/${websiteId}/author-messages/${id}/unread`),
};
