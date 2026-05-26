/**
 * @fileOverview UserBehaviorMock
 * Persists behavioral signals to simulate an AI training set for personalization.
 */

export interface UserBehaviorData {
  searches: string[];
  viewedSpecializations: string[];
  lastInteraction: number;
}

const STORAGE_KEY = "law_elite_behavior_ledger";

export const getBehaviorMock = (): UserBehaviorData => {
  if (typeof window === 'undefined') {
    return { searches: [], viewedSpecializations: [], lastInteraction: Date.now() };
  }
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { searches: [], viewedSpecializations: [], lastInteraction: Date.now() };
};

export const saveBehaviorMock = (data: UserBehaviorData) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...data,
    lastInteraction: Date.now()
  }));
};
