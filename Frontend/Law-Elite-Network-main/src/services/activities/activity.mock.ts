/**
 * @fileOverview Mock Activity Audit Implementation
 */

const STORAGE_KEY = 'law_elite_activities_v2';

export const mockCreateActivity = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const newActivity = {
    id: `act_${Date.now()}`,
    ...data,
    createdAt: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newActivity, ...existing]));
  window.dispatchEvent(new Event('activity_sync'));
  return newActivity;
};

export const mockGetActivities = (caseId: string) => {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return all.filter((a: any) => a.caseId === caseId);
};
