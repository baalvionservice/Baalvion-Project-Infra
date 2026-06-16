'use client';

import Link from 'next/link';
import { User, Briefcase, ArrowRight } from 'lucide-react';
import { AuthShell, Assurance } from '@/components/auth/auth-shell';

const PATHS = [
  {
    href: '/signup/candidate',
    icon: User,
    title: "I'm a Candidate",
    body: 'Prove your skills on real challenges and get hired on merit.',
    accent: 'group-hover:border-accent/60 group-hover:bg-accent/5',
    iconWrap: 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground',
  },
  {
    href: '/signup/company',
    icon: Briefcase,
    title: "I'm a Company",
    body: 'Find and hire talent based on proven, verified performance.',
    accent: 'group-hover:border-secondary/60 group-hover:bg-secondary/5',
    iconWrap: 'bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground',
  },
] as const;

export default function SignupPage() {
  return (
    <AuthShell
      variant="default"
      title="Create your account"
      subtitle="Choose your path — are you here to prove your skills, or to find the best talent?"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        {PATHS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${p.accent}`}
          >
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg transition-colors ${p.iconWrap}`}>
              <p.icon className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block font-headline text-base font-semibold text-foreground">{p.title}</span>
              <span className="block text-sm text-muted-foreground">{p.body}</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Assurance>Free to get started</Assurance>
        <Assurance>No credit card</Assurance>
        <Assurance>Verified scoring</Assurance>
      </div>
    </AuthShell>
  );
}
