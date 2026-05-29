/**
 * @fileOverview Lawyer Identity — REAL implementation.
 * Talks to the Node/Postgres law-service (`/v1/lawyers`). No Firebase, no mocks.
 * Maps the backend (snake_case `legal.lawyers`) onto the shape the UI expects.
 */
import { publicClient } from '@/lib/api/client';

const unwrapList = (res: any): any[] => {
  const d = res?.data?.data;
  if (Array.isArray(d)) return d;
  return d?.items || [];
};

/** Backend `legal.lawyers` row → UI lawyer model (drop-in for the old mock shape). */
export function adaptLawyer(l: any) {
  if (!l) return null;
  return {
    id: String(l.id),
    lawyerId: String(l.id),
    name: l.name,
    email: l.email,
    specialization: l.specializations || [],
    specializations: l.specializations || [],
    experience: l.experience ?? 0,
    rating: Number(l.rating ?? 0),
    totalReviews: l.total_reviews ?? 0,
    hourlyRate: Number(l.hourly_rate ?? 0),
    consultationFee: Number(l.hourly_rate ?? 0),
    country: l.country || null,
    countryCode: l.country_code || null,
    city: l.city || null,
    location: l.city && l.country ? `${l.city}, ${l.country}` : (l.country || (Array.isArray(l.jurisdictions) && l.jurisdictions[0]) || 'Global'),
    jurisdictions: l.jurisdictions || [],
    languages: l.languages || [],
    barNumber: l.bar_number || null,
    bio: l.bio || '',
    profileImage: l.profile_photo || `https://picsum.photos/seed/lawyer${l.id}/400/400`,
    isVerified: !!l.verified,
    available: l.status === 'active',
    status: l.status,
    availability: l.availability || {},
    createdAt: l.created_at || l.createdAt,
  };
}

// Lawyer self-onboarding: creates a PENDING profile (admin verifies before it goes live).
export const apiCreateLawyer = async (data: {
  name: string; email?: string; specializations?: string[]; experience?: number;
  hourly_rate?: number; bio?: string; jurisdictions?: string[]; languages?: string[];
  country?: string; country_code?: string; city?: string; bar_number?: string;
}) => {
  const { apiClient } = await import('@/lib/api/client');
  const res = await apiClient.post('/lawyers', data);
  return adaptLawyer(res?.data?.data);
};

export const apiGetAllLawyers = async () => {
  const res = await publicClient.get('/lawyers', { params: { limit: 100 } });
  return unwrapList(res).map(adaptLawyer);
};

export const apiGetLawyerById = async (id: string) => {
  const res = await publicClient.get(`/lawyers/${id}`);
  return adaptLawyer(res?.data?.data);
};

// Global directory: active-lawyer counts per country, for the "browse by country" rail.
export const apiGetCountries = async (): Promise<{ country: string; countryCode: string; count: number }[]> => {
  const res = await publicClient.get('/lawyers/countries');
  return res?.data?.data || [];
};

export const apiSearchLawyers = async (filters: {
  specialization?: string;
  minRating?: number;
  maxPrice?: number;
  query?: string;
  countryCode?: string;
}) => {
  const params: Record<string, any> = { limit: 100 };
  if (filters.query) params.q = filters.query;
  if (filters.minRating) params.minRating = filters.minRating;
  if (filters.maxPrice) params.maxRate = filters.maxPrice;
  if (filters.countryCode && filters.countryCode !== 'all') params.countryCode = filters.countryCode;

  const res = await publicClient.get('/lawyers/search', { params });
  let results = unwrapList(res).map(adaptLawyer);

  // Specialization filtered client-side so short UI labels ("Corporate") still
  // match richer backend values ("Corporate Law") without a taxonomy mapping.
  if (filters.specialization && filters.specialization !== 'all') {
    const needle = String(filters.specialization).toLowerCase();
    results = results.filter((l: any) => (l.specialization || []).some((s: string) => s.toLowerCase().includes(needle)));
  }
  return results;
};
