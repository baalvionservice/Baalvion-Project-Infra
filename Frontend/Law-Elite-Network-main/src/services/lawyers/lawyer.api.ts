/**
 * @fileOverview Lawyer Identity — REAL implementation.
 * Talks to the Node/Postgres law-service (`/v1/lawyers`). No Firebase, no mocks.
 * Maps the backend (snake_case `legal.lawyers`) onto the shape the UI expects.
 */
import { publicClient } from '@/lib/api/client';
import { resolvePersonImage } from '@/lib/article-art';

const unwrapList = (res: any): any[] => {
  const d = res?.data?.data;
  if (Array.isArray(d)) return d;
  return d?.items || [];
};

// Multi-currency: each lawyer's rate displays in their local currency, derived
// from country of practice (mirrors the backend utils/money currency map).
const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', IN: 'INR', AE: 'AED', SG: 'SGD', DE: 'EUR',
  FR: 'EUR', ES: 'EUR', IT: 'EUR', BR: 'BRL', JP: 'JPY',
};
const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'AED ', SGD: 'S$', BRL: 'R$', JPY: '¥',
};
export function currencyForCountry(code?: string | null): string {
  return COUNTRY_CURRENCY[String(code || '').toUpperCase()] || 'USD';
}
export function formatRate(amount: number, currency = 'USD'): string {
  const decimals = currency === 'JPY' ? 0 : 0; // hourly rates shown without cents
  return `${CURRENCY_SYMBOL[currency] || '$'}${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: decimals })}`;
}

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
    currency: currencyForCountry(l.country_code),
    displayRate: formatRate(Number(l.hourly_rate ?? 0), currencyForCountry(l.country_code)),
    country: l.country || null,
    countryCode: l.country_code || null,
    city: l.city || null,
    location: l.city && l.country ? `${l.city}, ${l.country}` : (l.country || (Array.isArray(l.jurisdictions) && l.jurisdictions[0]) || 'Global'),
    jurisdictions: l.jurisdictions || [],
    languages: l.languages || [],
    barNumber: l.bar_number || null,
    bio: l.bio || '',
    profileImage: resolvePersonImage({ avatarUrl: l.profile_photo, name: l.name, id: l.id }),
    // Distinct from `profileImage`, which always resolves to a generated
    // silhouette fallback — this is only true when a real photo was uploaded.
    hasProfilePhoto: !!l.profile_photo,
    isVerified: !!l.verified,
    available: l.status === 'active',
    status: l.status,
    availability: l.availability || {},
    createdAt: l.created_at || l.createdAt,
    // Registration wizard / Phase 3 profile enrichment (present when the
    // endpoint includes them — /lawyers/:id, /lawyers/me).
    state: l.state ? { id: l.state.id, name: l.state.name, code: l.state.code } : null,
    cityRef: l.cityRef ? { id: l.cityRef.id, name: l.cityRef.name } : null,
    practiceAreas: Array.isArray(l.practiceAreas) ? l.practiceAreas.map((p: any) => ({ id: p.id, name: p.name, slug: p.slug })) : [],
    availableFor: l.available_for || { consultation: true, case_referral: false, international_collaboration: false },
    licenseNumber: l.license_number || null,
    firmName: l.firm_name || null,
    isIndependent: l.is_independent ?? true,
  };
}

// Lawyer self-onboarding: creates a PENDING profile (admin verifies before it goes live).
export const apiCreateLawyer = async (data: {
  name: string; email?: string; specializations?: string[]; experience?: number;
  hourly_rate?: number; bio?: string; jurisdictions?: string[]; languages?: string[];
  country?: string; country_code?: string; city?: string; bar_number?: string;
  // Registration wizard: Location + Personal + Professional Details steps.
  state_id?: number; city_id?: number; dob?: string; gender?: string;
  license_number?: string; firm_name?: string; is_independent?: boolean;
  practice_area_ids?: string[];
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

// The authenticated lawyer's own full profile (state/city/practiceAreas/available_for
// included) — used by the dashboard's profile-completion widget.
export const apiGetMyLawyerProfile = async () => {
  const { apiClient } = await import('@/lib/api/client');
  try {
    const res = await apiClient.get('/lawyers/me');
    return adaptLawyer(res?.data?.data);
  } catch {
    return null;
  }
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
  stateId?: number | string;
  cityId?: number | string;
  practiceAreaId?: number | string;
  minExperience?: number | string;
  language?: string;
  verifiedOnly?: boolean;
  onlineOnly?: boolean;
}) => {
  const params: Record<string, any> = { limit: 100 };
  if (filters.query) params.q = filters.query;
  if (filters.minRating) params.minRating = filters.minRating;
  if (filters.maxPrice) params.maxRate = filters.maxPrice;
  if (filters.countryCode && filters.countryCode !== 'all') params.countryCode = filters.countryCode;
  if (filters.stateId) params.stateId = filters.stateId;
  if (filters.cityId) params.cityId = filters.cityId;
  if (filters.practiceAreaId) params.practiceAreaId = filters.practiceAreaId;
  if (filters.minExperience) params.minExperience = filters.minExperience;
  if (filters.language) params.language = filters.language;
  if (filters.verifiedOnly) params.verified = 'true';
  if (filters.onlineOnly) params.online = 'true';

  const res = await publicClient.get('/lawyers/search', { params });
  let results = unwrapList(res).map(adaptLawyer);

  // Legacy label-substring fallback — only applies when the caller passes the
  // old free-text `specialization` label instead of a real practiceAreaId.
  if (filters.specialization && filters.specialization !== 'all' && !filters.practiceAreaId) {
    const needle = String(filters.specialization).toLowerCase();
    results = results.filter((l: any) => (l.specialization || []).some((s: string) => s.toLowerCase().includes(needle)));
  }
  return results;
};
