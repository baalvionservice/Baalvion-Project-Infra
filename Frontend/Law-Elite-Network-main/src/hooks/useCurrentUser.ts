"use client";

import { useAuthStore } from "@/store/authStore";
import { User } from "@/types/user";

/**
 * @fileOverview useCurrentUser Hook
 * Provides instant access to the logged-in member's profile from the global store.
 */
export const useCurrentUser = (): User | null => {
  return useAuthStore((state) => state.user);
};
