'use client';

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CommandPalette from './CommandPalette';
import { useAuthStore } from '@/lib/store/authStore';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  // Hold page content until the auth bootstrap (cookie refresh) has resolved. Otherwise pages
  // fire their data queries before the access token is restored → a transient 401 on every hard
  // reload (it self-heals via the refresh interceptor, but this avoids the wasted round-trip and
  // console noise). Client-side navigation is already hydrated, so this is a no-op there.
  const isHydrated = useAuthStore((s) => s.isHydrated);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="container mx-auto p-6 max-w-screen-2xl">
            {isHydrated ? (
              children
            ) : (
              <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Restoring your session…
              </div>
            )}
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
