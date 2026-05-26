import { mockUsers } from "./mockUsers";
import { User } from "@/types/user";

/**
 * @fileOverview Mock Authentication Service.
 * Simulates Firebase Auth operations using LocalStorage.
 */

export const loginMock = async (email: string, password: string): Promise<User> => {
  // Artificial delay to simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  const user = mockUsers.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) throw new Error("Invalid professional credentials. Access denied.");

  const { password: _, ...userProfile } = user;
  localStorage.setItem("law_elite_user", JSON.stringify(userProfile));

  return userProfile as User;
};

export const signupMock = async (email: string, fullName: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const newUser: User = {
    id: `MOCK_${Date.now()}`,
    email,
    name: fullName,
    role: "client", // Default role for mock signups
    createdAt: Date.now(),
  };

  localStorage.setItem("law_elite_user", JSON.stringify(newUser));

  return newUser;
};

export const logoutMock = () => {
  localStorage.removeItem("law_elite_user");
};

export const getCurrentMockUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem("law_elite_user");
  return user ? JSON.parse(user) : null;
};
