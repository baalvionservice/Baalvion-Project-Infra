'use client';
// Firestore removed — this hook now returns empty data immediately.
// Components using this hook should be updated to use REST API hooks directly.
export function useCollection<T = unknown>(_query: unknown) {
  return { data: [] as T[], loading: false, error: null, snapshot: null };
}
