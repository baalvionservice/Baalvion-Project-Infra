/**
 * @fileOverview AvailabilityService — LIVE (law-service). No mock, no Firebase.
 * Persists a practitioner's availability into their lawyer.availability JSONB
 * (keyed by date), via the authenticated /lawyers/me record.
 */
import { apiClient } from '@/lib/api/client';

async function getMyLawyer(): Promise<any | null> {
  try { return (await apiClient.get('/lawyers/me'))?.data?.data; } catch { return null; }
}

export const setAvailability = async (availability: any): Promise<void> => {
  const me = await getMyLawyer();
  if (!me?.id) throw new Error('No lawyer profile found for this account.');
  const current = me.availability && typeof me.availability === 'object' && !Array.isArray(me.availability) ? me.availability : {};
  const next = { ...current, [availability.date]: availability.slots || [] };
  await apiClient.patch(`/lawyers/${me.id}/availability`, { availability: next });
};

export const getAvailabilityByLawyer = async (_lawyerId?: string): Promise<any[]> => {
  const me = await getMyLawyer();
  const av = me?.availability;
  if (!av || typeof av !== 'object') return [];
  return Object.entries(av).map(([date, slots]) => ({
    lawyerId: me.id,
    date,
    slots: Array.isArray(slots) ? slots : [],
  }));
};
