'use client';
// Firestore removed — this hook now returns null immediately.
// Components using this hook should be updated to use REST API hooks directly.
export function useDoc<T = unknown>(_docRef: unknown) {
  return { data: null as T | null, loading: false, error: null };
}
