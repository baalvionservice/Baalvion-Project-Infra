import { apiClient } from '@/services/api-client';
import { TableQuery } from '@/components/system/DataTable';
import { Student } from '@/modules/students/domain/student.entity';

export const campusServerService = {
  async getAIMatches(query: TableQuery) {
    const response = await apiClient.get(
      `/talent/matches?${new URLSearchParams(query as any)}`,
    );
    if (!response.success)
      throw new Error(response.error || 'Failed to fetch AI matches');
    return response.data || [];
  },

  async getRecentPlacements(limit: number): Promise<Student[]> {
    const response = await apiClient.get(
      `/campus/placements?limit=${limit}&approved=true`,
    );
    if (!response.success)
      throw new Error(response.error || 'Failed to fetch recent placements');
    const raw = response.data as any;
    return raw?.rows ?? raw?.data ?? raw ?? [];
  },
};
