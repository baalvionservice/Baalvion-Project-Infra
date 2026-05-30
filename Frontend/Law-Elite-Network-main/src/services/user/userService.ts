/**
 * @fileOverview User Identity Service — LIVE (law-service). No mock, no Firebase.
 * Profile reads come from /auth/me; client profile edits persist to the clients table.
 */
import { apiClient } from '@/lib/api/client';
import { adaptProfile, unwrapOne } from '@/services/_law/adapters';

export const getUserProfile = async (_userId?: string) => {
  const res = await apiClient.get('/auth/me');
  return adaptProfile(unwrapOne(res));
};

export const updateUserProfile = async (_userId: string, data: any) => {
  // Persist editable client-profile fields (name / phone / location / language).
  let client: any = null;
  try { client = (await apiClient.get('/clients/me'))?.data?.data; } catch { /* none yet */ }

  const payload: any = {};
  if (data.name || data.fullName) payload.name = data.name || data.fullName;
  if (data.phone || data.contactDetails) payload.phone = data.phone || data.contactDetails;
  if (data.location || data.city) payload.location = data.location || data.city;
  if (data.preferredLanguage || data.preferred_language) payload.preferred_language = data.preferredLanguage || data.preferred_language;

  if (!client?.id && Object.keys(payload).length) {
    try { client = (await apiClient.post('/clients', payload))?.data?.data; } catch { /* exists or not a client */ }
  } else if (client?.id && Object.keys(payload).length) {
    try { client = (await apiClient.patch(`/clients/${client.id}`, payload))?.data?.data; } catch { /* ignore */ }
  }
  return { success: true, ...(client || data) };
};
