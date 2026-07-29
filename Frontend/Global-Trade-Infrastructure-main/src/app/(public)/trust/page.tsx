import { Metadata } from 'next';
import { ShieldCheck, FileCheck2, Lock, Globe2 } from 'lucide-react';
import { pageMetadata, breadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import { getPlatformPulse } from '@/server/public/platform-pulse';
import { getTrustPulse } from '@/server/public/trust-pulse';

/**
 * @file (public)/trust/page.tsx
 * @description Trust Center (Phase 3) — every figure on this page traces to a
 * real, aggregate-only query (this app's own Postgres, or a direct
 * server-to-server read of trade-service's independently-verifiable audit
 * hash-chain). Deliberately does NOT have an "Incident History" section —
 * no platform-level incident/uptime/SLA tracking system exists anywhere in
 * the monorepo yet (confirmed by research), and inventing one would be
 * exactly the kind of fabricated trust signal this whole page exists to
 * avoid. Add it once a real system exists, not before.
 */

const TITLE = 'Trust Center';
const DESCRIPTION = 'Real, verifiable facts about platform integrity, audit accountability, risk & compliance, and security architecture — nothing on this page is illustrative.';

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/trust',
  keywords: ['trust center', 'platform security', 'audit trail', 'compliance', 'data encryption', 'row level security'],
});

// Reads the DB + a cross-service call directly — forced dynamic so build
// doesn't require a reachable DB at build time. See authorities/page.tsx for
// the full rationale.
export const dynamic = 'force-dynamic';

const SECURITY_HEADERS = [
  { name: 'Strict-Transport-Security', detail: 'max-age=63072000; includeSubDomains; preload' },
  { name: 'Content-Security-Policy', detail: "frame-ancestors 'none'; object-src 'none'; default-src 'self'" },
  { name: 'X-Frame-Options', detail: 'SAMEORIGIN' },
  { name: 'X-Content-Type-Options', detail: 'nosniff' },
  { name: 'Referrer-Policy', detail: 'strict-origin-when-cross-origin' },
  { name: 'Permissions-Policy', detail: 'camera=(), microphone=(), geolocation=()' },
];

function StatRow({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'warn' }) {
  const toneClass = tone === 'good' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' : 'text-white';
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-3 last:border-0">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <span className={`text-sm font-black tabular-nums ${toneClass}`}>{value}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof ShieldCheck; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 border border-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-black uppercase tracking-tight text-white">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

function fmtPercent(n: number | null): string {
  return n === null ? 'No checks recorded yet' : `${(n * 100).toFixed(1)}%`;
}

export default async function TrustCenterPage() {
  const [pulse, trust] = await Promise.all([getPlatformPulse(), getTrustPulse()]);

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Trust Center', path: '/trust' }]))} />

      <section className="border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary">
            <ShieldCheck className="size-4" /> Trust Center
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">Verify, don&apos;t take our word for it.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400">{DESCRIPTION}</p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-14 grid gap-6 md:grid-cols-2">
          <Section icon={Globe2} title="Platform Integrity">
            <StatRow label="Platform Status" value={pulse.dbHealthy ? 'Operational' : 'Degraded'} tone={pulse.dbHealthy ? 'good' : 'warn'} />
            <StatRow
              label="Ledger Integrity"
              value={pulse.ledgerBalanced ? 'All Books Balanced' : 'Under Review'}
              tone={pulse.ledgerBalanced ? 'good' : 'warn'}
            />
            <StatRow label="Escrows On Platform" value={pulse.escrowCount.toLocaleString()} />
          </Section>

          <Section icon={FileCheck2} title="Audit &amp; Accountability">
            <StatRow label="Organizations On Platform" value={trust.organizationCount.toLocaleString()} />
            <StatRow label="Audit Events Recorded" value={trust.auditEventCount.toLocaleString()} />
            {trust.auditChain ? (
              <>
                <StatRow
                  label="Audit Hash-Chain Integrity"
                  value={trust.auditChain.valid ? 'Verified' : 'Tamper Detected'}
                  tone={trust.auditChain.valid ? 'good' : 'warn'}
                />
                {trust.auditChain.entries !== null && (
                  <StatRow label="Chain Entries" value={trust.auditChain.entries.toLocaleString()} />
                )}
                {trust.auditChain.headHashPrefix && (
                  <StatRow label="Chain Head Hash" value={`${trust.auditChain.headHashPrefix}…`} />
                )}
              </>
            ) : (
              <p className="pt-2 text-xs text-slate-500">Audit hash-chain status is temporarily unavailable.</p>
            )}
          </Section>

          <Section icon={ShieldCheck} title="Risk &amp; Compliance">
            <StatRow label="Risk Assessments Completed" value={trust.riskAssessmentCount.toLocaleString()} />
            <StatRow label="Compliance Checks Run" value={trust.complianceCheckCount.toLocaleString()} />
            <StatRow
              label="Compliance Pass Rate"
              value={fmtPercent(trust.compliancePassRate)}
              tone={trust.compliancePassRate !== null && trust.compliancePassRate >= 0.9 ? 'good' : 'default'}
            />
          </Section>

          <Section icon={Lock} title="Security Architecture">
            <div className="space-y-3 pb-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Every response from this application enforces the following HTTP security headers — verifiable with any browser&apos;s network inspector or <code className="text-slate-300">curl -I</code>.
              </p>
              <ul className="space-y-1.5">
                {SECURITY_HEADERS.map((h) => (
                  <li key={h.name} className="text-xs">
                    <span className="font-black text-slate-300">{h.name}</span>
                    <span className="ml-2 text-slate-500">{h.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            <StatRow label="Trade Document Encryption" value="AES-256-GCM" tone="good" />
            <StatRow label="Tenant Data Isolation" value="PostgreSQL RLS, enforced in CI" tone="good" />
          </Section>
        </div>
      </section>
    </>
  );
}
