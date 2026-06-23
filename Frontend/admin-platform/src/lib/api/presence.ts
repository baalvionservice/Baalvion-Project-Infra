import { serviceClients } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

// Live storefront presence (commerce-service public storefront router). Anonymous, read-only.
// The storefront itself sends the heartbeats; the admin only READS the resulting per-store count.
export interface LiveVisitorCount {
  count: number;
}

const client = serviceClients.commerce;

export const presenceApi = {
  count: (storeId: string) =>
    client.get<ApiResponse<LiveVisitorCount>>(
      `/commerce/storefront/${storeId}/presence/count`,
    ),
};
