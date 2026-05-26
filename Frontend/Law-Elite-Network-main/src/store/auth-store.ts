
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserCore, UserRole } from "@/lib/api/types";

interface AuthState {
  user: UserCore | null;
  role: UserRole;
  isAuthenticated: boolean;
  setUser: (user: UserCore | null) => void;
  setRole: (role: UserRole) => void;
  logout: () => void;
}

/**
 * Zustand store for Auth State.
 * Optimized for fast, reactive UI updates.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setRole: (role) => set({ role }),
      logout: () => set({ user: null, role: null, isAuthenticated: false }),
    }),
    {
      name: "law-elite-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
