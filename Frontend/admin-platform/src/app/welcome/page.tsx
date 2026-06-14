'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, Cpu, Handshake, Landmark, Scale, ShieldCheck, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import BaalvionMark from '@/components/auth/BaalvionMark';
import { firstNameOf, getRoleWelcome, getTimeGreeting, type RoleWelcome } from '@/lib/auth/roleWelcome';

const ICONS: Record<RoleWelcome['icon'], LucideIcon> = {
  ShieldCheck,
  Landmark,
  Activity,
  Cpu,
  Scale,
  Handshake,
  UserRound,
};

const AUTO_ADVANCE_MS = 3400;

export default function WelcomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const welcome = useMemo(() => getRoleWelcome(user?.role), [user?.role]);
  const greeting = useMemo(() => getTimeGreeting(), []);
  const firstName = firstNameOf(user?.fullName);

  const enter = useCallback(() => router.replace('/dashboard'), [router]);

  // No session in memory after hydration settled → nothing to celebrate, go straight in.
  useEffect(() => {
    if (isHydrated && !user) {
      router.replace('/dashboard');
    }
  }, [isHydrated, user, router]);

  // Auto-advance into the dashboard after the intro plays.
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(enter, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [user, enter]);

  if (!user) return null;

  const Icon = ICONS[welcome.icon];

  return (
    <div className="bv-content">
      <div className="bv-reveal mb-10">
        <BaalvionMark size={46} />
      </div>

      <div className="bv-reveal bv-reveal-d1 bv-halo mb-7">
        <div className="bv-halo__inner">
          <Icon className="h-12 w-12 text-[--bv-blue-soft]" strokeWidth={1.4} />
        </div>
      </div>

      <span className="bv-reveal bv-reveal-d1 bv-chip mb-5">
        <span className="bv-dot-live" /> {welcome.division} · System Online
      </span>

      <h1 className="bv-greet bv-reveal bv-reveal-d2 max-w-3xl text-center">
        {greeting},{' '}
        <span className="bv-greet__role">{firstName || welcome.roleName}</span>
      </h1>

      <p className="bv-reveal bv-reveal-d2 mt-3 text-center text-sm font-medium uppercase tracking-[0.2em] text-[--bv-ink-dim]">
        {welcome.roleName} · {welcome.clearance}
      </p>

      <p className="bv-reveal bv-reveal-d3 mt-6 max-w-xl text-center text-base leading-relaxed text-[#c3cce6]">
        {welcome.message}
      </p>

      <div className="bv-reveal bv-reveal-d4 mt-9 flex flex-col items-center gap-5">
        <div className="bv-progress" role="presentation">
          <div className="bv-progress__bar" />
        </div>
        <button type="button" onClick={enter} className="bv-ghost-btn">
          Enter Console <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="bv-footer">
        Establishing secure link to global operations · Trade — Finance — AI — Infrastructure
      </div>
    </div>
  );
}
