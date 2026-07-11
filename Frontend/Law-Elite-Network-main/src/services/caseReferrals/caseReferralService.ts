/**
 * @fileOverview Case-Referral Service — professional case routing between
 * lawyers (spec area 6). Distinct from the growth referral-code program
 * (src/services/referral*). Backed by law-service /v1/case-referrals.
 */
import { apiClient } from '@/lib/api/client';

export type CaseReferralStatus = 'sent' | 'accepted' | 'declined' | 'case_shared' | 'completed' | 'cancelled';

export interface CaseReferral {
  id: number;
  status: CaseReferralStatus;
  title: string;
  description?: string | null;
  countryCode?: string | null;
  createdAt: string;
  fromLawyer: { id: number; name: string; email: string; profile_photo?: string | null };
  toLawyer: { id: number; name: string; email: string; profile_photo?: string | null };
  practiceArea?: { id: number; name: string; slug: string } | null;
  state?: { id: number; name: string } | null;
  city?: { id: number; name: string } | null;
  caseId?: number | null;
}

function unwrap<T>(data: any): T {
  return (data && data.data !== undefined ? data.data : data) as T;
}

const adaptReferral = (r: any): CaseReferral => ({
  id: r.id,
  status: r.status,
  title: r.title,
  description: r.description,
  countryCode: r.country_code,
  createdAt: r.created_at || r.createdAt,
  fromLawyer: r.fromLawyer,
  toLawyer: r.toLawyer,
  practiceArea: r.practiceArea,
  state: r.state,
  city: r.city,
  caseId: r.case_id,
});

export const createCaseReferral = async (data: {
  toLawyerId: number; title: string; description?: string;
  countryCode?: string; stateId?: number; cityId?: number; practiceAreaId?: number;
}): Promise<CaseReferral> => {
  const res = await apiClient.post('/case-referrals', data);
  return adaptReferral(unwrap(res?.data));
};

export const listCaseReferrals = async (box: 'incoming' | 'outgoing', status?: string): Promise<CaseReferral[]> => {
  const res = await apiClient.get('/case-referrals', { params: { box, status } });
  const data = unwrap<any>(res?.data);
  const items = Array.isArray(data) ? data : data?.items || [];
  return items.map(adaptReferral);
};

export const acceptCaseReferral = async (id: number) => apiClient.post(`/case-referrals/${id}/accept`);
export const declineCaseReferral = async (id: number) => apiClient.post(`/case-referrals/${id}/decline`);
export const cancelCaseReferral = async (id: number) => apiClient.post(`/case-referrals/${id}/cancel`);
export const shareCaseOnReferral = async (id: number, caseId: number) => apiClient.post(`/case-referrals/${id}/share-case`, { caseId });
export const completeCaseReferral = async (id: number) => apiClient.post(`/case-referrals/${id}/complete`);

export const getPendingReferralCount = async (): Promise<number> => {
  try {
    const res = await apiClient.get('/case-referrals/pending-count');
    return Number(unwrap<{ count: number }>(res?.data)?.count ?? 0);
  } catch {
    return 0;
  }
};
