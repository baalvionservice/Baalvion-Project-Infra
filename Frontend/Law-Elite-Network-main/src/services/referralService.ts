/**
 * @fileOverview ReferralService
 * Orchestrates the network's growth engine and reward synchronization.
 */

import {
  getReferralMock,
  saveReferralMock,
} from "@/lib/mock/referralMock";
import { Referral } from "@/types/referral";

/**
 * Generates a unique executive referral identifier.
 */
export const generateReferralCode = (userId: string): string => {
  const prefix = userId.slice(0, 4).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `ELITE-${prefix}-${timestamp}`;
};

/**
 * Retrieves the referral dossier for a specific member.
 */
export const getUserReferral = async (userId: string): Promise<Referral | null> => {
  const data = getReferralMock();
  return data.find((r) => r.userId === userId) || null;
};

/**
 * Provisions a new referral record for a member.
 */
export const createReferral = async (userId: string): Promise<Referral> => {
  const data = getReferralMock();
  const existing = data.find((r) => r.userId === userId);

  if (existing) return existing;

  const newReferral: Referral = {
    userId,
    code: generateReferralCode(userId),
    referredUsers: [],
    rewards: 0,
  };

  saveReferralMock([...data, newReferral]);
  return newReferral;
};

/**
 * Applies a referral code during the onboarding protocol.
 */
export const applyReferral = async (
  code: string,
  newUserId: string
): Promise<void> => {
  const data = getReferralMock();

  const updated = data.map((r) => {
    if (r.code.toUpperCase() === code.toUpperCase()) {
      return {
        ...r,
        referredUsers: [...r.referredUsers, newUserId],
        rewards: r.rewards + 100, // ₹100 Reward Credit
      };
    }
    return r;
  });

  saveReferralMock(updated);
};
