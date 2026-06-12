import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StudentOnboardingForm } from './student-onboarding-form';

export const metadata: Metadata = {
  title: 'Join as a Student — Internships & Graduate Roles',
  description:
    'Join Baalvion as a student. Build a verified profile, get AI-matched to internships and graduate roles, and receive real offers judged on your skills — always free for students.',
  alternates: { canonical: '/onboarding/student' },
  openGraph: {
    title: 'Join as a Student | Baalvion TalentOS',
    description:
      'Create a verified student profile, get matched to internships and full-time roles, and launch your career on merit. Free for students.',
    url: '/onboarding/student',
  },
};

export default function StudentOnboardingPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Join as a student</h1>
          <p className="mt-3 text-muted-foreground">
            Get discovered by verified recruiters and matched to roles that fit your skills.
            It&apos;s free, and it takes a few minutes.
          </p>
        </div>
        <StudentOnboardingForm />
      </div>
    </main>
  );
}
