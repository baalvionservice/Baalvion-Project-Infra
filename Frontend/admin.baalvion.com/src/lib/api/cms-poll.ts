import { cmsApiClient } from './client';
import { useCmsStore } from '@/lib/store/cmsStore';
import type { ApiResponse } from '@/lib/types/common.types';

const wid = (): string => {
  const id = useCmsStore.getState().activeWebsiteId;
  if (!id) throw new Error('No active website selected');
  return id;
};

export interface ContentPoll {
  id: string;
  contentId: string;
  question: string;
  options: string[];
  status: 'active' | 'closed';
}

export const cmsPollApi = {
  get: (contentId: string) =>
    cmsApiClient.get<ApiResponse<ContentPoll | null>>(`/cms/websites/${wid()}/content/${contentId}/poll`),

  upsert: (contentId: string, payload: { question: string; options: string[] }) =>
    cmsApiClient.put<ApiResponse<ContentPoll>>(`/cms/websites/${wid()}/content/${contentId}/poll`, payload),

  remove: (contentId: string) =>
    cmsApiClient.delete<ApiResponse<void>>(`/cms/websites/${wid()}/content/${contentId}/poll`),
};
