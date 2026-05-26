
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { OnboardingFlow } from './onboarding-flow';
import { Logo } from '@/components/logo';

export default function CandidateOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== 'candidate' || user.candidateOnboardingCompleted) {
    router.replace('/candidate/dashboard');
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                <Logo />
            </div>
        </header>
        <main className="flex-1">
            <div className="container py-8 md:py-12">
                <OnboardingFlow />
            </div>
        </main>
    </div>
  );
}
