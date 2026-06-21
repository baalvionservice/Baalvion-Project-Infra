'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Loader2, Clock, ShieldAlert, Building2, FileText } from 'lucide-react';

interface Eligibility {
  signedIn?: boolean;
  eligible?: boolean;
  reason?: string;
  dealRoomUnlocksAt?: string | null;
  cooldownMinutes?: number | null;
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Opens a deal for an eligible, signed-in investor and routes into the deal room. Eligibility
// (approved application + corporate email + post-approval cool-down) is enforced server-side in
// the BFF; here we mirror it for clear UX so the user knows why the button is gated.
export default function ExpressInterestButton({ opportunityId, companyOrg }: { opportunityId: string; companyOrg?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elig, setElig] = useState<Eligibility | null>(null);
  const [now, setNow] = useState<number>(0);

  // Pre-flight eligibility so we can render the right state before the user clicks.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/ir/eligibility', { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (active && json?.success) setElig(json.data as Eligibility);
      } catch {
        /* leave elig null — the click path still enforces server-side */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Tick once a second while a cool-down is active so the countdown stays live.
  const unlockAt = elig?.reason === 'COOLDOWN' && elig.dealRoomUnlocksAt ? new Date(elig.dealRoomUnlocksAt).getTime() : 0;
  useEffect(() => {
    if (!unlockAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [unlockAt]);

  const onClick = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/mp/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId, org_id_company: companyOrg }),
      });
      if (res.status === 401) {
        window.location.href = `/invest/${opportunityId}?login=1`;
        return;
      }
      const json = await res.json();
      if (res.status === 403 && json?.error?.code === 'NOT_ELIGIBLE') {
        setElig({ signedIn: true, eligible: false, reason: json.error.reason, dealRoomUnlocksAt: json.error.dealRoomUnlocksAt });
        setLoading(false);
        return;
      }
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || json?.error || 'Could not open the deal.');
      router.push(`/invest/deals/${json.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setLoading(false);
    }
  }, [opportunityId, companyOrg, router]);

  // Gated states with a clear explanation instead of the open-deal button.
  const reason = elig?.reason;
  const cooldownActive = reason === 'COOLDOWN' && unlockAt > now;

  if (elig && !elig.eligible && elig.signedIn !== false) {
    if (reason === 'NO_APPLICATION') {
      return (
        <Gate icon={FileText} tone="neutral">
          Investor access is required.{' '}
          <Link href="/onboarding" className="font-semibold text-primary hover:underline">Apply now</Link>.
        </Gate>
      );
    }
    if (reason === 'PENDING_REVIEW') {
      return <Gate icon={Clock} tone="amber">Your investor application is under review. You&apos;ll be emailed once it&apos;s approved.</Gate>;
    }
    if (reason === 'REJECTED') {
      return (
        <Gate icon={ShieldAlert} tone="red">
          Your application wasn&apos;t approved.{' '}
          <Link href="/resources/contact-ir" className="font-semibold text-primary hover:underline">Contact IR</Link>.
        </Gate>
      );
    }
    if (reason === 'PERSONAL_EMAIL') {
      return (
        <Gate icon={Building2} tone="amber">
          Deal rooms require a company (corporate) email.{' '}
          <Link href="/resources/contact-ir" className="font-semibold text-primary hover:underline">Contact IR</Link> to update your account.
        </Gate>
      );
    }
    if (cooldownActive) {
      return (
        <Gate icon={Clock} tone="amber">
          Approved — deal-room access unlocks in <span className="font-mono font-semibold">{formatRemaining(unlockAt - now)}</span>.
        </Gate>
      );
    }
  }

  return (
    <div>
      <button
        onClick={onClick}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
        {loading ? 'Opening deal…' : 'Express interest'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Gate({
  children,
  icon: Icon,
  tone,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'neutral' | 'amber' | 'red';
}) {
  const tones = {
    neutral: 'border-gray-200 bg-gray-50 text-gray-600',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    red: 'border-red-200 bg-red-50 text-red-700',
  } as const;
  return (
    <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed ${tones[tone]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
