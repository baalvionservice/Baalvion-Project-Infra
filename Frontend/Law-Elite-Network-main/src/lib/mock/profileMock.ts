/**
 * @fileOverview Profile Mock Storage.
 * Simulates Firestore/API behavior using LocalStorage for rapid prototyping.
 */

export const getProfileMock = async (userId: string) => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(`profile_${userId}`);
  return data ? JSON.parse(data) : null;
};

export const updateProfileMock = async (userId: string, profile: any) => {
  if (typeof window === 'undefined') return profile;
  localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));
  // Also update the main auth record for consistency in this mock
  const userStr = localStorage.getItem("law_elite_user");
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.id === userId) {
      localStorage.setItem("law_elite_user", JSON.stringify({ ...user, ...profile }));
    }
  }
  return profile;
};
