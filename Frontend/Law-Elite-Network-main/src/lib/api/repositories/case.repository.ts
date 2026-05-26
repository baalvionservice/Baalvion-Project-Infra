
import { apiClient } from '@/lib/api/client';

export interface CaseSearchParams {
  clientUid?: string;
  caseType?: string;
  city?: string;
  status?: 'open' | 'in_progress' | 'closed';
  pageSize?: number;
  lastDoc?: null;
}

export class CaseRepository {
  constructor() {}

  async create(data: any) {
    try {
      const res = await apiClient.post('/cases', data);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async getById(caseId: string) {
    try {
      const res = await apiClient.get(`/cases/${caseId}`);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async update(caseId: string, data: any) {
    try {
      await apiClient.patch(`/cases/${caseId}`, data);
    } catch {
      // no-op
    }
  }

  async findCases(params: CaseSearchParams) {
    try {
      const queryParams: Record<string, any> = {};
      if (params.clientUid) queryParams.clientUid = params.clientUid;
      if (params.status) queryParams.status = params.status;
      if (params.caseType) queryParams.caseType = params.caseType;
      if (params.city) queryParams.city = params.city;

      const limit = Math.min(params.pageSize || 20, 100);
      queryParams.limit = limit;

      const res = await apiClient.get('/cases', { params: queryParams });
      return res.data?.data ?? [];
    } catch {
      return [];
    }
  }
}
