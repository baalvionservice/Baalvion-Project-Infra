import { apiClient } from '@/lib/apiClient';

import { adapter } from './adapter';
import { Placement } from '@/types/placement.types';

export const placementService = {
    getApprovedPlacements: (): Promise<Placement[]> => adapter.getApprovedPlacements(),

    /**
     * The public showcase. Returns only non-identifying fields, so it needs no session —
     * unlike getApprovedPlacements, which is the staff view and 401s for a visitor.
     */
    async getPublicPlacements(limit = 24) {
      const res = await apiClient.get<any>(`/campus/placements/public?limit=${limit}`);
      const data = res.success ? res.data : null;
      return {
        items: (data?.items ?? []) as any[],
        stats: data?.stats ?? { placements: 0, companies: 0, colleges: 0 },
      };
    },
    getPendingPlacements: (): Promise<Placement[]> => adapter.getPendingPlacements(),
    approvePlacement: (id: string, updates: { auditLogs: any[] }): Promise<Placement> => adapter.approvePlacement(id, updates),
};
