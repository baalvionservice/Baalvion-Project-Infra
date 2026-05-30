import { authClient } from './client';
import type {
  LoginPayload,
  LoginResponse,
  AuthUser,
  MfaVerifyPayload,
  RefreshResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/lib/types/auth.types';
import type { ApiResponse } from '@/lib/types/common.types';
import type { OrgSummary } from '@/lib/types/organization.types';

// Backend returns a different shape — normalize here so the rest of the app is unchanged

interface BackendUser {
  id: string | number;
  orgId: string | null;
  email: string;
  // auth-service returns `fullName`; tolerate legacy `name` too.
  fullName?: string;
  name?: string;
  avatarUrl?: string | null;
  role: string;
  status: string;
  mfaEnabled: boolean;
  emailVerified: boolean;
}

interface BackendLoginData {
  // auth-service returns `accessToken`; tolerate legacy `token` too.
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user: BackendUser;
  expiresAt?: string;
}

const toAuthUser = (raw: BackendUser): AuthUser => ({
  id: Number(raw.id),
  email: raw.email,
  fullName: raw.fullName ?? raw.name ?? '',
  avatarUrl: raw.avatarUrl ?? null,
  status: raw.status as AuthUser['status'],
  emailVerifiedAt: raw.emailVerified ? new Date().toISOString() : null,
  mfaEnabled: raw.mfaEnabled,
  role: raw.role as AuthUser['role'],
  orgId: raw.orgId,
  permissions: [],
  sessionId: '',
  createdAt: new Date().toISOString(),
});

const toExpiresIn = (expiresAt?: string): number => {
  if (!expiresAt) return 900;
  return Math.max(60, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
};

export const authApi = {
  login: async (payload: LoginPayload) => {
    const res = await authClient.post<ApiResponse<BackendLoginData>>('/login', payload);
    const raw = res.data.data;
    const normalized: LoginResponse = {
      user: toAuthUser(raw.user),
      accessToken: raw.accessToken ?? raw.token ?? '',
      expiresIn: toExpiresIn(raw.expiresAt),
      org: null,
    };
    return { ...res, data: { ...res.data, data: normalized } } as typeof res & {
      data: ApiResponse<LoginResponse>;
    };
  },

  logout: () => authClient.post<ApiResponse<void>>('/logout'),

  refresh: async () => {
    const res = await authClient.post<ApiResponse<BackendLoginData>>('/refresh');
    const raw = res.data.data;
    const normalized: RefreshResponse = {
      accessToken: raw.accessToken ?? raw.token ?? '',
      expiresIn: toExpiresIn(raw.expiresAt),
    };
    return { ...res, data: { ...res.data, data: normalized } } as typeof res & {
      data: ApiResponse<RefreshResponse>;
    };
  },

  me: async () => {
    const res = await authClient.get<ApiResponse<BackendUser>>('/me');
    const normalized = toAuthUser(res.data.data);
    return { ...res, data: { ...res.data, data: normalized } } as typeof res & {
      data: ApiResponse<AuthUser>;
    };
  },

  updateMe: (payload: Partial<Pick<AuthUser, 'fullName' | 'avatarUrl'>>) =>
    authClient.patch<ApiResponse<AuthUser>>('/me', payload),

  mfaVerify: (payload: MfaVerifyPayload) =>
    authClient.post<ApiResponse<LoginResponse>>('/mfa/verify', payload),

  mfaEnable: () => authClient.post<ApiResponse<{ qrCode: string; secret: string }>>('/mfa/enable'),

  mfaDisable: (code: string) =>
    authClient.delete<ApiResponse<void>>('/mfa/disable', { data: { code } }),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    authClient.post<ApiResponse<void>>('/forgot-password', payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    authClient.post<ApiResponse<void>>('/reset-password', payload),

  verifyEmail: (token: string) =>
    authClient.post<ApiResponse<void>>('/verify-email', { token }),

  getOrgs: () => authClient.get<ApiResponse<OrgSummary[]>>('/orgs'),

  createOrg: (payload: { name: string; slug: string }) =>
    authClient.post<ApiResponse<OrgSummary>>('/orgs', payload),

};
