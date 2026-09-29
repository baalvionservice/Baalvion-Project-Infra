import { adminApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

/**
 * Per-business access — trade, jobs, IR and the rest.
 *
 * Website access lives in the CMS (websitesApi); this is everything else. Both are granted
 * from the same People screen so "who can reach what" is one question with one answer, rather
 * than one per product.
 */
export interface BusinessGrant {
  id: number;
  userId: number;
  business: string;
  role: string;
  grantedAt: string;
  expiresAt: string | null;
  email?: string;
  fullName?: string;
}

export interface BusinessCatalog {
  businesses: string[];
  /** Each business keeps its own role vocabulary — they are deliberately not unified. */
  roles: Record<string, string[]>;
}

/** BIGINT ids arrive from Postgres as strings; coerced so joins on user id actually match. */
const toGrant = (g: BusinessGrant): BusinessGrant => ({
  ...g,
  id: Number(g.id),
  userId: Number(g.userId),
});

export const businessAccessApi = {
  catalog: async () => {
    const res = await adminApiClient.get<ApiResponse<BusinessCatalog>>('/admin/business-access/catalog');
    return res.data.data;
  },

  listAll: async () => {
    const res = await adminApiClient.get<ApiResponse<BusinessGrant[]>>('/admin/business-access');
    return (res.data.data ?? []).map(toGrant);
  },

  grant: async (payload: { userId: number; businesses: string[]; role: string; expiresAt?: string | null }) => {
    const res = await adminApiClient.post<ApiResponse<{ granted: BusinessGrant[] }>>(
      '/admin/business-access',
      payload,
    );
    return res.data.data;
  },

  /** Omit `business` to remove every business at once — the offboarding action. */
  revoke: async (userId: number, business?: string) => {
    const res = await adminApiClient.delete<ApiResponse<{ revoked: BusinessGrant[] }>>(
      `/admin/business-access/${userId}`,
      { params: business ? { business } : undefined },
    );
    return res.data.data;
  },
};
