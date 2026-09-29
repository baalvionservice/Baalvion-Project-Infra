/**
 * Client-side facade for the in-app onboarding API.
 * Public forms call the `submit*` helpers; the admin queue calls `list*` /
 * `updateStatus` (cookie-authenticated, hence `credentials: 'include'`).
 */
import type {
  CollegeApplication,
  CollegeApplicationInput,
  StudentApplication,
  StudentApplicationInput,
  ApplicationStatus,
} from '@/lib/server/onboarding-schemas';
import { getBearerToken, setTokens } from '@/lib/apiClient';
import { refresh } from '@/lib/authClient';

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: unknown;
}

interface SubmitResult {
  referenceId: string;
}

async function postJson<T>(url: string, body: unknown): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * Fetch helper for admin-only onboarding endpoints. Attaches the in-memory
 * access token as a Bearer credential (the server verifies the role against
 * the identity service). On a 401 it transparently refreshes the token once via
 * the httpOnly refresh cookie and retries.
 */
async function adminFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string | null): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...init, headers, credentials: 'include' });
  };

  let res = await send(getBearerToken());
  if (res.status === 401) {
    const refreshed = await refresh();
    if (refreshed) {
      setTokens(refreshed);
      res = await send(refreshed);
    }
  }
  return res;
}

function flattenError(error: unknown, fallback: string): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'fieldErrors' in error) {
    const fieldErrors = (error as { fieldErrors: Record<string, string[]> }).fieldErrors;
    const first = Object.values(fieldErrors).flat()[0];
    if (first) return first;
  }
  return fallback;
}

export const onboardingService = {
  async submitCollege(input: CollegeApplicationInput): Promise<SubmitResult> {
    const json = await postJson<SubmitResult>('/api/onboarding/college', input);
    if (!json.success || !json.data) {
      throw new Error(flattenError(json.error, 'Failed to submit your application.'));
    }
    return json.data;
  },

  async submitStudent(input: StudentApplicationInput): Promise<SubmitResult> {
    const json = await postJson<SubmitResult>('/api/onboarding/student', input);
    if (!json.success || !json.data) {
      throw new Error(flattenError(json.error, 'Failed to submit your application.'));
    }
    return json.data;
  },

  async listColleges(status?: ApplicationStatus): Promise<CollegeApplication[]> {
    const qs = status ? `?status=${status}` : '';
    const res = await adminFetch(`/api/onboarding/college${qs}`);
    const json: ApiEnvelope<CollegeApplication[]> = await res.json();
    return json.success && json.data ? json.data : [];
  },

  async listStudents(status?: ApplicationStatus): Promise<StudentApplication[]> {
    const qs = status ? `?status=${status}` : '';
    const res = await adminFetch(`/api/onboarding/student${qs}`);
    const json: ApiEnvelope<StudentApplication[]> = await res.json();
    return json.success && json.data ? json.data : [];
  },

  async updateStatus(
    collection: 'college' | 'student',
    id: string,
    status: ApplicationStatus,
    reviewNotes?: string,
  ): Promise<boolean> {
    const res = await adminFetch(`/api/onboarding/${collection}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewNotes }),
    });
    const json: ApiEnvelope<unknown> = await res.json();
    return json.success;
  },
};
