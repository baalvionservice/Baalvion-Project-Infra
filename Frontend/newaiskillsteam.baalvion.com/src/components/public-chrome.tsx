'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Auth surfaces (login + the whole signup/onboarding funnel) are full-bleed: the branded
// AuthShell owns the entire viewport, so the marketing Navbar/Footer are suppressed there.
const FULL_BLEED_PREFIXES = ['/login', '/signup'];

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isFullBleed = FULL_BLEED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isFullBleed) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
