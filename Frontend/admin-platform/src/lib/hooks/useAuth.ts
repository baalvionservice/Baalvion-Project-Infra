'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';
import type { LoginPayload, MfaVerifyPayload } from '@/lib/types/auth.types';

export const useAuth = () => {
  const store = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: ({ data }) => {
      const { user, org, accessToken, expiresIn, mfaRequired, tempToken } = data.data;
      if (mfaRequired && tempToken) {
        return { mfaRequired: true, tempToken };
      }
      store.setAuth(user, accessToken, expiresIn, org);
      router.replace('/dashboard');
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || 'Login failed');
    },
  });

  const mfaMutation = useMutation({
    mutationFn: (payload: MfaVerifyPayload) => authApi.mfaVerify(payload),
    onSuccess: ({ data }) => {
      const { user, org, accessToken, expiresIn } = data.data;
      store.setAuth(user, accessToken, expiresIn, org);
      router.replace('/dashboard');
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || 'MFA verification failed');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      store.logout();
      queryClient.clear();
      router.replace('/login');
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  return {
    user: store.user,
    currentOrg: store.currentOrg,
    orgs: store.orgs,
    isAuthenticated: store.isAuthenticated(),
    isHydrated: store.isHydrated,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    verifyMfa: mfaMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isVerifyingMfa: mfaMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
};

export const useCurrentUser = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me().then((r) => r.data.data),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};
