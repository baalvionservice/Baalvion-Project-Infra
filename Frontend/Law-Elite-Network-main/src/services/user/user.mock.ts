/**
 * @fileOverview Mock User Identity Implementation
 * Simulates API latency and local persistence for profile management.
 */

export const mockGetUserProfile = async (userId: string) => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check if a modified profile exists in local storage
  const stored = localStorage.getItem(`law_elite_profile_${userId}`);
  if (stored) return JSON.parse(stored);

  // Return seed data for initial testing
  return {
    userId,
    name: "Jonathan Doe",
    email: "client@test.com",
    role: "client",
    profileImage: "https://picsum.photos/seed/user1/400/400",
    phone: "+1 (555) 000-1234",
    createdAt: Date.now() - 86400000 * 30, // Joined 30 days ago
    updatedAt: Date.now(),
  };
};

export const mockUpdateUserProfile = async (userId: string, data: any) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const existing = await mockGetUserProfile(userId);
  const updated = {
    ...existing,
    ...data,
    updatedAt: Date.now(),
  };

  localStorage.setItem(`law_elite_profile_${userId}`, JSON.stringify(updated));
  return updated;
};
