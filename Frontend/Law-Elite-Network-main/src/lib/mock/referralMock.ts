/**
 * @fileOverview Referral Mock Storage.
 * Simulates persistence for the network's viral growth engine.
 */

import { Referral } from "@/types/referral";

const STORAGE_KEY = "law_elite_referrals";

export const getReferralMock = (): Referral[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveReferralMock = (data: Referral[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
