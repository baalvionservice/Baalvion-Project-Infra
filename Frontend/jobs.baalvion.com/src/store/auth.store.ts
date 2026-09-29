
import { create } from "zustand";
import { User, UserRole } from "@/types/contracts";
import { setTokens, clearTokens, getBearerToken } from "@/lib/apiClient";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setRole: (role: UserRole) => void;
  // refreshToken is accepted for call-site compatibility but is never stored client-side —
  // the refresh token is an httpOnly cookie set by auth-service.
  setTokens: (user: User, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: typeof window !== 'undefined' ? getBearerToken() : null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setRole: (role) => set(state => state.user ? ({ user: { ...state.user, role } }) : state),
  setTokens: (user, accessToken) => {
    setTokens(accessToken);
    set({ user, accessToken, isLoading: false });
  },
  clearAuth: () => {
    clearTokens();
    set({ user: null, accessToken: null, isLoading: false });
  },
}));
