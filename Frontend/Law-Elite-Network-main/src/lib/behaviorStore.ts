/**
 * BehaviorStore — client-side (localStorage) record of the signed-in user's REAL behavior
 * (searches typed, lawyer specializations viewed). Powers on-device search personalization.
 * This is genuine client state (starts empty, records actual user actions) — not mock data.
 */
export interface UserBehaviorData {
  searches: string[];
  viewedSpecializations: string[];
  lastInteraction: number;
}

const STORAGE_KEY = "law_elite_behavior_ledger";

export const getBehavior = (): UserBehaviorData => {
  if (typeof window === 'undefined') {
    return { searches: [], viewedSpecializations: [], lastInteraction: Date.now() };
  }
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { searches: [], viewedSpecializations: [], lastInteraction: Date.now() };
};

export const saveBehavior = (data: UserBehaviorData) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, lastInteraction: Date.now() }));
};
