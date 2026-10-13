import { cmsApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';
import type { CmsRole } from '@/lib/types/cms-website.types';

export type AccessRequestStatus = 'pending' | 'approved' | 'denied';

export interface AccessRequest {
  id: string;
  websiteId: string;
  userId: string | number;
  requesterEmail: string | null;
  requesterName: string | null;
  requestedRole: CmsRole;
  note: string | null;
  status: AccessRequestStatus;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  website?: { id: string; slug: string; name: string };
}

export interface RequestableWebsite {
  id: string;
  slug: string;
  name: string;
}

export const accessRequestsApi = {
  requestable: () =>
    cmsApiClient.get<ApiResponse<RequestableWebsite[]>>('/cms/access-requests/websites').then((r) => r.data.data ?? []),
  mine: () =>
    cmsApiClient.get<ApiResponse<AccessRequest[]>>('/cms/access-requests/mine').then((r) => r.data.data ?? []),
  create: (payload: { websiteId: string; role: CmsRole; note?: string }) =>
    cmsApiClient.post<ApiResponse<AccessRequest>>('/cms/access-requests', payload).then((r) => r.data.data),
  // Platform admins only — everyone else gets a 403.
  list: (status: AccessRequestStatus | 'all' = 'pending') =>
    cmsApiClient.get<ApiResponse<AccessRequest[]>>('/cms/access-requests', { params: { status } }).then((r) => r.data.data ?? []),
  approve: (id: string, payload: { role?: CmsRole; decisionNote?: string }) =>
    cmsApiClient.post<ApiResponse<AccessRequest>>(`/cms/access-requests/${id}/approve`, payload).then((r) => r.data.data),
  deny: (id: string, payload: { decisionNote?: string }) =>
    cmsApiClient.post<ApiResponse<AccessRequest>>(`/cms/access-requests/${id}/deny`, payload).then((r) => r.data.data),
};
