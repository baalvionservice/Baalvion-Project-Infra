/**
 * Client for the same-origin auth edge (/auth-bff/* → worker → auth-service /v1/auth/*). First-party
 * with credentials so the auth-service refresh cookie lands on `.baalvion.com` (shared across every
 * Baalvion subdomain).
 */
export interface ApiError {
  code: string;
  message: string;
}

export interface RequestOtpResult {
  sentTo: string;
  expiresAt: string;
  resendAvailableInSeconds: number;
  resendsRemaining: number;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  initials: string;
}

export interface VerifyOtpResult {
  accessToken: string;
  user: AuthUser;
  expiresAt: string;
  isNewUser: boolean;
}

async function call<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/auth-bff/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
  } catch {
    throw { code: 'NETWORK', message: 'Network error. Check your connection and try again.' } as ApiError;
  }

  let json: { success?: boolean; data?: T; error?: { code?: string; message?: string } } = {};
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }

  if (!res.ok || json.success === false) {
    throw {
      code: json.error?.code || `HTTP_${res.status}`,
      message: json.error?.message || 'Something went wrong. Please try again.',
    } as ApiError;
  }
  return json.data as T;
}

export function requestEmailOtp(input: {
  firstName: string;
  lastName: string;
  email: string;
  captchaToken?: string;
}): Promise<RequestOtpResult> {
  return call<RequestOtpResult>('email/otp/request', input);
}

export function verifyEmailOtp(input: { email: string; code: string }): Promise<VerifyOtpResult> {
  return call<VerifyOtpResult>('email/otp/verify', input);
}

export function isApiError(e: unknown): e is ApiError {
  return !!e && typeof e === 'object' && 'message' in e;
}
