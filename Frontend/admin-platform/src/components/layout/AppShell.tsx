'use client';

import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CommandPalette from './CommandPalette';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="container mx-auto p-6 max-w-screen-2xl">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
