import { cmsApiClient } from './client';
import type { PendingComment } from '@/lib/types/cms-engagement.types';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/common.types';

// Reader comment moderation — cms-service's engagementService.js. Every comment
// starts 'pending' (see cmsSubmitComment on the public site) and only ever
// reaches readers once approved here.
export const cmsEngagementApi = {
  pendingComments: (websiteId: string, params?: { page?: number; limit?: number }) =>
    cmsApiClient.get<PaginatedResponse<PendingComment>>(
      `/cms/websites/${websiteId}/content/comments/pending`,
      { params },
    ),

  moderateComment: (websiteId: string, commentId: string, status: 'approved' | 'rejected') =>
    cmsApiClient.patch<ApiResponse<PendingComment>>(
      `/cms/websites/${websiteId}/content/comments/${commentId}/moderate`,
      { status },
    ),
};
