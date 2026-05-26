
'use client';

import { OnboardingFunnel } from '@/components/onboarding/OnboardingFunnel';
import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Onboarding Header */}
      <header className="h-16 border-b flex items-center px-8 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity">
          <span className="tracking-tighter text-xl">Baalvion</span>
        </Link>
        <div className="ml-auto flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          <span>Institutional Registration</span>
          <span className="h-1 w-1 rounded-full bg-primary" />
          <span>v2.1.0-secure</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <OnboardingFunnel />
      </div>

      {/* Onboarding Footer */}
      <footer className="p-8 text-center text-[10px] text-muted-foreground uppercase tracking-widest border-t bg-card/20">
        <p>SEC Rule 501 Compliance Simulation • All data is encrypted and handled per Baalvion Fiduciary Standards</p>
      </footer>
    </main>
  );
}
