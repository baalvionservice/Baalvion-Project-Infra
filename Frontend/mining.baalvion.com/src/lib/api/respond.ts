/**
 * @fileOverview Tiny response envelope helper for the /api/* route handlers.
 *
 * Every API response uses the canonical shape:
 *   success → { success: true,  data }
 *   failure → { success: false, error }
 *
 * Keeping this in one place guarantees a consistent contract across resources
 * and means individual handlers never hand-roll `Response.json`.
 */

/** Canonical success envelope. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/** Canonical failure envelope. */
export interface ApiFailure {
  success: false;
  error: string;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/** 200 OK with the success envelope. */
export function ok<T>(data: T): Response {
  const body: ApiSuccess<T> = { success: true, data };
  return Response.json(body, { status: 200 });
}

/** Failure with the error envelope (defaults to 400 Bad Request). */
export function fail(error: string, status = 400): Response {
  const body: ApiFailure = { success: false, error };
  return Response.json(body, { status });
}
