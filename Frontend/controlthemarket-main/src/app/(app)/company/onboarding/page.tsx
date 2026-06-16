'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { OnboardingFlow } from './onboarding-flow';
import { Logo } from '@/components/logo';

export default function CompanyOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (user?.role !== 'company' || user.onboardingCompleted) {
    router.replace('/company/dashboard');
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-muted/30 via-background to-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Logo />
                <span className="text-sm text-muted-foreground">Set up your workspace</span>
            </div>
        </header>
        <main className="flex-1">
            <div className="container py-10 md:py-14">
                <div className="mx-auto mb-8 max-w-3xl text-center">
                    <h1 className="font-headline text-3xl font-bold tracking-tight">Let&apos;s get your team set up</h1>
                    <p className="mt-2 text-muted-foreground">A few steps to verify your company and post your first challenge.</p>
                </div>
                <OnboardingFlow />
            </div>
        </main>
    </div>
  );
}
