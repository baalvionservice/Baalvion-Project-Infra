"use client";

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { StudioClient } from '@/components/studio/StudioClient';

export default function StudioPage() {
  return (
    <ProtectedRoute>
      <StudioGate />
    </ProtectedRoute>
  );
}

// The API re-checks this server-side; the client check only avoids showing a broken tool.
function StudioGate() {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return (
      <main className="min-h-screen pt-[120px] px-6">
        <p className="max-w-xl text-slate-600">The Article Studio is for Law Elite Network editors. Your account does not have access.</p>
      </main>
    );
  }
  return <StudioClient />;
}
