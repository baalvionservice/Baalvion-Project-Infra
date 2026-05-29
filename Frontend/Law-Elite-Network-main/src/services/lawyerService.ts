/**
 * @fileOverview LawyerService (top-level) — LIVE. Delegates to the real law-service
 * adapter (Postgres). No mock, no Firebase.
 */
import { apiClient } from '@/lib/api/client';
import { apiGetAllLawyers, apiGetLawyerById, apiSearchLawyers, adaptLawyer } from '@/services/lawyers/lawyer.api';

export const getLawyerById = async (id: string) => apiGetLawyerById(id);

export const getAllLawyers = async () => apiGetAllLawyers();

export const searchLawyers = async (query: string) => apiSearchLawyers({ query });

/** The authenticated practitioner's own profile (lawyer dashboard / editing). */
export const getLawyerProfile = async (_userId?: string) => {
  try {
    const res = await apiClient.get('/lawyers/me');
    return adaptLawyer(res?.data?.data);
  } catch {
    return null;
  }
};

export const updateLawyerProfile = async (_userId: string, data: any) => {
  const me = await apiClient.get('/lawyers/me').then((r) => r?.data?.data).catch(() => null);
  if (!me?.id) throw new Error('No lawyer profile to update');
  const res = await apiClient.patch(`/lawyers/${me.id}`, data);
  return adaptLawyer(res?.data?.data);
};
