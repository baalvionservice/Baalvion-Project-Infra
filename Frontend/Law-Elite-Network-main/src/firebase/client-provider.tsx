'use client';
import React from 'react';

// Firebase removed — this is now a passthrough wrapper.
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
