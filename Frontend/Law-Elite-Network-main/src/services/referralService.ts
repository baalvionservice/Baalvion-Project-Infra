/**
 * @fileOverview ReferralService — LIVE (law-service referrals / Postgres). No mock, no Firebase.
 * Codes are generated/stored server-side; the member's code is fetched (created on first read).
 */
import { referralApi } from '@/lib/api/client';

const adaptReferral = (r: any, stats?: any) => ({
  code: r?.code,
  referralId: r?.referralId != null ? String(r.referralId) : undefined,
  referredUsers: stats?.referred ?? stats?.referredUsers ?? [],
  totalReferred: stats?.totalReferred ?? stats?.completed ?? 0,
  rewards: stats?.rewards ?? stats?.totalRewards ?? 0,
});

export const getUserReferral = async (_userId?: string) => {
  try {
    const [codeRes, statsRes] = await Promise.all([
      referralApi.getMyCode(),
      referralApi.stats().catch(() => ({ data: { data: {} } })),
    ]);
    return adaptReferral(codeRes?.data?.data, statsRes?.data?.data);
  } catch {
    return null;
  }
};

// getMyCode creates the code on first access, so "create" == fetch.
export const createReferral = async (_userId?: string) => getUserReferral();

export const applyReferral = async (code: string, _newUserId?: string) => {
  await referralApi.apply(code);
  return { success: true };
};
