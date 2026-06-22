'use client';

import Link from 'next/link';
import { BusinessOnboardingFunnel } from '@/components/onboarding/business/BusinessOnboardingFunnel';

export default function BusinessOnboardingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b flex items-center px-8 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity">
          <span className="tracking-tighter text-xl">Baalvion</span>
        </Link>
        <div className="ml-auto flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          <span>Business Onboarding</span>
          <span className="h-1 w-1 rounded-full bg-primary" />
          <span>KYC · IEC/GST/VAT</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <BusinessOnboardingFunnel />
      </div>

      <footer className="p-8 text-center text-[10px] text-muted-foreground uppercase tracking-widest border-t bg-card/20">
        <p>All data is encrypted and processed under Baalvion compliance standards · KYC / AML screening applies</p>
      </footer>
    </main>
  );
}
