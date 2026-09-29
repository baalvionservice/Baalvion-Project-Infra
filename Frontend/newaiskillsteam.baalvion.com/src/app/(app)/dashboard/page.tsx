'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-semibold">Loading your dashboard...</p>
        <p className="text-muted-foreground">Please wait a moment.</p>
      </div>
    </div>
  );
}
