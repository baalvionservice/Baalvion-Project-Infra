import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types/user";

/**
 * @fileOverview Zustand store for global Authentication state.
 * Maintains session identity and professional profile metadata.
 */

interface AuthState {
  user: User | null;
  profile: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      loading: false,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ user: null, profile: null }),
    }),
    {
      name: "law-elite-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
