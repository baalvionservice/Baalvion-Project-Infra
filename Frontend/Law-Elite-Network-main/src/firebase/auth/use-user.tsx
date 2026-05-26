'use client';
// Firebase Auth removed — use useUser() from @/context/AuthContext instead.
export function useUser() { return { user: null, loading: false }; }
