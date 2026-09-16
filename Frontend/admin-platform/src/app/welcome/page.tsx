'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { firstNameOf, getRoleWelcome, getTimeGreeting } from '@/lib/auth/roleWelcome';

const AUTO_ADVANCE_MS = 4000;

export default function WelcomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  // Rendered after hydration only — a server-rendered clock would mismatch the client.
  const [signedInAt, setSignedInAt] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState(Math.round(AUTO_ADVANCE_MS / 1000));

  const welcome = useMemo(() => getRoleWelcome(user?.role), [user?.role]);
  const greeting = useMemo(() => getTimeGreeting(), []);
  const firstName = firstNameOf(user?.fullName);

  const enter = useCallback(() => router.replace('/dashboard'), [router]);

  useEffect(() => {
    setSignedInAt(
      new Date().toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
      }),
    );
  }, []);

  // No session in memory after hydration settled → nothing to summarise, go straight in.
  useEffect(() => {
    if (isHydrated && !user) {
      router.replace('/dashboard');
    }
  }, [isHydrated, user, router]);

  // Auto-advance into the dashboard, with the countdown the operator can see.
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(enter, AUTO_ADVANCE_MS);
    const i = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
  }, [user, enter]);

  if (!user) return null;

  return (
    <section className="bv-enter">
      <span className="bv-rail__eyebrow bv-reveal">
        <span className="bv-dot-live bv-dot-live--red" />
        Session established
      </span>

      <h1 className="bv-enter__greet bv-reveal bv-reveal-d1">
        <span className="bv-enter__greeting">{greeting},</span>{' '}
        {firstName || welcome.roleName}
      </h1>

      <div className="bv-facts bv-reveal bv-reveal-d2">
        <div className="bv-fact">
          <div className="bv-fact__label">Role</div>
          <div className="bv-fact__value">{welcome.roleName}</div>
        </div>
        <div className="bv-fact">
          <div className="bv-fact__label">Access</div>
          <div className="bv-fact__value">{welcome.access}</div>
        </div>
        <div className="bv-fact">
          <div className="bv-fact__label">Division</div>
          <div className="bv-fact__value">{welcome.division}</div>
        </div>
        <div className="bv-fact">
          <div className="bv-fact__label">Signed in</div>
          <div className="bv-fact__value">{signedInAt || '—'}</div>
        </div>
      </div>

      <p className="bv-enter__lede bv-reveal bv-reveal-d3">{welcome.message}</p>

      <div className="bv-enter__actions bv-reveal bv-reveal-d3">
        <button type="button" onClick={enter} className="bv-biobtn bv-enter__btn">
          Enter console <ArrowRight className="h-4 w-4" />
        </button>
        <span className="bv-enter__auto">
          {secondsLeft > 0 ? `Continuing automatically in ${secondsLeft}s` : 'Opening console'}
        </span>
      </div>

      <div className="bv-enter__progress bv-reveal bv-reveal-d3" role="presentation">
        <div className="bv-enter__bar" />
      </div>
    </section>
  );
}
