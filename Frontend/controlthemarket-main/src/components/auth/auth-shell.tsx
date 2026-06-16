'use client';

import * as React from 'react';
import Link from 'next/link';
import { LineChart, ShieldCheck, Trophy, Zap, CheckCircle2 } from 'lucide-react';

type Variant = 'default' | 'candidate' | 'company';

type ProofPoint = { icon: React.ElementType; title: string; body: string };

const PROOF: Record<Variant, { eyebrow: string; headline: string; sub: string; points: ProofPoint[] }> = {
  default: {
    eyebrow: 'Hiring, decided on merit',
    headline: 'Talent proves itself.\nThe market decides.',
    sub: 'ControlTheMarket is where candidates prove real skill on real challenges — and companies hire the people who can actually do the work.',
    points: [
      { icon: ShieldCheck, title: 'Verified by work, not words', body: 'Every score comes from a graded, real-world challenge.' },
      { icon: Trophy, title: 'A ranked, public arena', body: 'Leaderboards that reward outcomes, not résumés.' },
      { icon: Zap, title: 'Hire in days, not weeks', body: 'Skip the noise — shortlist from proven performance.' },
    ],
  },
  candidate: {
    eyebrow: 'For candidates',
    headline: 'Stop sending résumés.\nStart proving skill.',
    sub: 'Take real challenges, earn a verified score, and let hiring teams come to you based on what you can actually build.',
    points: [
      { icon: ShieldCheck, title: 'Own a verified track record', body: 'Your work is graded and provable — not just claimed.' },
      { icon: Trophy, title: 'Climb the leaderboard', body: 'Rank against your field and get noticed on merit.' },
      { icon: Zap, title: 'Get matched, fast', body: 'Strong scores surface you to companies hiring now.' },
    ],
  },
  company: {
    eyebrow: 'For hiring teams',
    headline: 'Hire the people\nwho can do the work.',
    sub: 'Shortlist from verified, graded performance instead of self-reported résumés. Less screening, better signal, faster offers.',
    points: [
      { icon: ShieldCheck, title: 'Signal you can trust', body: 'Decisions backed by graded, real-world challenges.' },
      { icon: Trophy, title: 'Rank your pipeline', body: 'See candidates ordered by proven ability, instantly.' },
      { icon: Zap, title: 'Cut time-to-hire', body: 'Move straight to the people who already performed.' },
    ],
  },
};

const STATS = [
  { value: '12k+', label: 'verified candidates' },
  { value: '480', label: 'hiring teams' },
  { value: '38k', label: 'challenges graded' },
];

function BrandMark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-headline font-bold tracking-tight ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-accent to-primary text-primary-foreground shadow-lg shadow-primary/30">
        <LineChart className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="text-lg">
        Control<span className="text-accent">the</span>Market
      </span>
    </span>
  );
}

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: Variant;
  /** Optional back-link shown above the title, e.g. "← Choose a different path". */
  backHref?: string;
  backLabel?: string;
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  variant = 'default',
  backHref,
  backLabel,
}: Props) {
  const copy = PROOF[variant];

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]">
      {/* ── Brand panel (desktop) ─────────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-[hsl(222,47%,11%)] text-white lg:flex lg:flex-col">
        {/* layered depth: brand gradient + accent glow + fine grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 100% 0%, hsl(190 80% 55% / 0.18), transparent 55%),' +
              'radial-gradient(90% 70% at 0% 100%, hsl(142 70% 45% / 0.14), transparent 50%),' +
              'linear-gradient(160deg, hsl(220 60% 18%) 0%, hsl(222 55% 12%) 55%, hsl(222 47% 9%) 100%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(0 0% 100% / 0.6) 1px, transparent 1px),' +
              'linear-gradient(90deg, hsl(0 0% 100% / 0.6) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(110% 110% at 30% 20%, black, transparent 75%)',
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="w-fit">
            <BrandMark />
          </Link>

          <div className="max-w-md">
            <p className="mb-4 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-accent">
              {copy.eyebrow}
            </p>
            <h2 className="whitespace-pre-line font-headline text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
              {copy.headline}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/65">{copy.sub}</p>

            <ul className="mt-9 space-y-4">
              {copy.points.map((p) => (
                <li key={p.title} className="flex gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/10">
                    <p.icon className="h-[18px] w-[18px] text-accent" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{p.title}</span>
                    <span className="block text-sm text-white/55">{p.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-8 border-t border-white/10 pt-7">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="font-headline text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/45">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Form / content panel ──────────────────────────────────────────── */}
      <main className="flex flex-col bg-background">
        {/* Mobile brand bar */}
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Link href="/">
            <BrandMark className="text-foreground" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
          <div className="w-full max-w-md">
            {backHref && (
              <Link
                href={backHref}
                className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ← {backLabel ?? 'Back'}
              </Link>
            )}

            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>}

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Small inline value-prop, handy on the chooser/confirmation screens. */
export function Assurance({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
      {children}
    </span>
  );
}
