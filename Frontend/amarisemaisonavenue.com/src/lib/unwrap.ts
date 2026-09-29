/**
 * Single global adapter for the backend response envelope.
 * Verified shape (commerce/order utils/response.js):
 *   success:  { success: true, data, meta }
 *   paginated:{ success: true, items, total, page, pageSize, totalPages, meta }
 *   error:    { success: false, error: { code, message, details } }
 *
 * ALL api-client calls funnel raw JSON through unwrapResponse<T>() so the UI never
 * sees an envelope. On an error envelope it throws ApiEnvelopeError (callers convert
 * it to a typed ApiResult — see api-client apiFetch).
 */

export interface BackendError {
  code?: string;
  message?: string;
  details?: unknown;
}

export class ApiEnvelopeError extends Error {
  code?: string;
  details?: unknown;
  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiEnvelopeError';
    this.code = code;
    this.details = details;
  }
}

export function unwrapResponse<T>(raw: unknown): T {
  if (raw == null || typeof raw !== 'object') return raw as T;
  const env = raw as { success?: boolean; data?: unknown; error?: BackendError } & Record<string, unknown>;

  if (env.success === false) {
    throw new ApiEnvelopeError(env.error?.message || 'Request failed', env.error?.code, env.error?.details);
  }

  // Standard success envelope → inner data.
  if ('data' in env) return env.data as T;

  // Paginated envelope (data is spread, not nested) → strip envelope-only keys.
  const { success: _success, meta: _meta, error: _error, ...rest } = env;
  void _success; void _meta; void _error;
  return rest as T;
}
