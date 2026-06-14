import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CollegeOnboardingForm } from './college-onboarding-form';

export const metadata: Metadata = {
  title: 'Onboard Your College — Campus Placement Partner',
  description:
    'Onboard your college or university to Baalvion. Submit your placement cell details and get a verified, analytics-ready placement system with direct access to a national recruiter network.',
  alternates: { canonical: '/onboarding/college' },
  openGraph: {
    title: 'Onboard Your College | Baalvion TalentOS',
    description:
      'Automate campus placements with verified student profiles, real-time analytics, and a national employer network. Apply in minutes.',
    url: '/onboarding/college',
  },
};

export default function CollegeOnboardingPage() {
  return (
    <main className="bg-muted/40 min-h-screen py-12 lg:py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to onboarding
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Onboard your college
          </h1>
          <p className="mt-3 text-muted-foreground">
            Join the institutions running transparent, fraud-free campus placements on
            Baalvion. It takes a few minutes — no documents required upfront.
          </p>
        </div>
        <CollegeOnboardingForm />
      </div>
    </main>
  );
}
