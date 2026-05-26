/**
 * @fileOverview Lawyer Profile Mock Storage.
 * Simulates practitioner-specific Firestore/API behavior.
 */

export const getLawyerProfileMock = async (userId: string) => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(`lawyer_profile_${userId}`);
  return data ? JSON.parse(data) : null;
};

export const updateLawyerProfileMock = async (userId: string, profile: any) => {
  if (typeof window === 'undefined') return profile;
  const data = {
    ...profile,
    updatedAt: Date.now(),
  };
  localStorage.setItem(`lawyer_profile_${userId}`, JSON.stringify(data));
  return data;
};
