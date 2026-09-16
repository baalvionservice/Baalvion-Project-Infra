'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Globe, KeyRound, CreditCard, Server, Database, ChevronDown, ChevronRight,
  BellRing, BellOff, RefreshCw, AlertTriangle, CheckCircle2, HeartPulse, XCircle,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/lib/store/uiStore';
import { useRealtimeStore } from '@/lib/store/realtimeStore';
import { statusApi } from '@/lib/api/status';
import type { ProbeStatus, ProbeCell, SiteStatus, StatusRollup, ServiceCell, SeoCell } from '@/lib/api/status';
import { cn } from '@/lib/utils/cn';

// ── Plain English ─────────────────────────────────────────────────────────────
// This page is read by the person deciding whether to stop what they are doing. Every label is
// the sentence they would say out loud — not the state name the prober happens to use.
const WORDS: Record<ProbeStatus, string> = {
  up: 'Working',
  degraded: 'Having trouble',
  down: 'Not working',
  not_deployed: 'Not set up',
  not_configured: 'Not configured',
  no_rails: 'No payments set up',
  unknown: 'Not checked yet',
};

const isFault = (s: ProbeStatus) => s === 'down' || s === 'degraded';
const dot = (s: ProbeStatus) =>
  s === 'up' ? 'bg-emerald-500' : s === 'down' ? 'bg-red-500' : s === 'degraded' ? 'bg-amber-500' : 'bg-muted-foreground/40';
const tone = (s: ProbeStatus) =>
  s === 'up' ? 'text-emerald-600' : s === 'down' ? 'text-red-600' : s === 'degraded' ? 'text-amber-600' : 'text-muted-foreground';

function ago(iso?: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))} seconds`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} minutes`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)} hours`;
  return `${Math.round(ms / 86_400_000)} days`;
}

const reasonOf = (c?: ProbeCell) => (c?.detail?.reason as string | undefined) || undefined;

/**
 * Turn a property's raw cells into sentences a person can act on, ordered by what it costs to
 * ignore them: money first, then the front door, then the plumbing.
 */
function problemsFor(site: SiteStatus): { text: string; detail?: string; severity: 'bad' | 'warn' }[] {
  const out: { text: string; detail?: string; severity: 'bad' | 'warn' }[] = [];
  const p = site.pills;
  const takesMoney = site.rails.length > 0;

  if (isFault(p.payments.status)) {
    out.push({
      text: p.payments.status === 'down' ? 'Payments are failing' : 'Payments look wrong',
      detail: reasonOf(p.payments),
      severity: 'bad',
    });
  }
  if (isFault(p.website.status)) {
    out.push({
      text: p.website.status === 'down' ? "The website isn't loading for visitors" : 'The website is slow or partly broken',
      detail: reasonOf(p.website),
      severity: p.website.status === 'down' ? 'bad' : 'warn',
    });
  }
  if (isFault(p.auth.status)) {
    out.push({
      text: p.auth.status === 'down' ? "People can't sign in" : 'Sign-in is having trouble',
      detail: reasonOf(p.auth),
      severity: takesMoney || p.auth.status === 'down' ? 'bad' : 'warn',
    });
  }
  const running = site.services.filter((s) => s.deployment !== 'not-deployed');
  const broken = running.filter((s) => isFault(s.status));
  if (broken.length) {
    out.push({
      text: `${broken.length} of ${running.length} background services aren't responding`,
      detail: broken.map((s) => s.name).join(', '),
      severity: 'bad',
    });
  }
  if (isFault(p.data.status)) {
    out.push({ text: 'The database is unreachable', detail: reasonOf(p.data), severity: 'bad' });
  }
  const seoIssues = (site.seo?.detail?.checks ?? []).filter((c) => !c.ok && c.severity !== 'info');
  if (seoIssues.length) {
    out.push({
      text: `${seoIssues.length} thing${seoIssues.length > 1 ? 's' : ''} stopping Google finding this site`,
      detail: seoIssues.map((c) => c.detail || c.label).join(' · '),
      severity: 'warn',
    });
  }
  return out;
}

// ── One line of the plain-English checklist ───────────────────────────────────
function CheckLine({ icon: Icon, label, cell, note }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  cell: ProbeCell | { status: ProbeStatus };
  note?: string;
}) {
  const s = cell.status;
  const reason = reasonOf(cell as ProbeCell);
  return (
    <div className="flex items-center gap-2.5 py-1.5 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="w-24 shrink-0">{label}</span>
      <span className={cn('h-2 w-2 rounded-full shrink-0', dot(s))} />
      <span className={cn('font-medium', tone(s))}>{WORDS[s] ?? WORDS.unknown}</span>
      {(reason || note) && <span className="text-muted-foreground truncate text-xs">— {reason || note}</span>}
    </div>
  );
}

function Checklist({ site }: { site: SiteStatus }) {
  return (
    <div className="rounded-md bg-muted/40 p-2.5">
      <CheckLine icon={Globe} label="Website" cell={site.pills.website} />
      <CheckLine icon={KeyRound} label="Sign-in" cell={site.pills.auth} />
      <CheckLine icon={CreditCard} label="Payments" cell={site.pills.payments}
        note={site.rails.length ? undefined : 'this property does not take payments'} />
      <CheckLine icon={Server} label="Services" cell={site.pills.services} />
      <CheckLine icon={Database} label="Database" cell={site.pills.data} />
    </div>
  );
}

// ── Findability ───────────────────────────────────────────────────────────────
function Findability({ seo }: { seo?: SeoCell }) {
  const checks = seo?.detail?.checks ?? [];
  if (!checks.length) return <p className="text-sm text-muted-foreground">Not checked yet.</p>;
  return (
    <div className="space-y-1">
      {checks.map((c) => (
        <div key={c.id} className="flex items-start gap-2 text-sm">
          {c.ok
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            : c.severity === 'critical'
              ? <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
          <span className={cn('shrink-0', c.ok ? 'text-muted-foreground' : 'text-foreground font-medium')}>{c.label}</span>
          {c.detail && <span className="text-muted-foreground text-xs mt-0.5 min-w-0">— {c.detail}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Technical detail — present, but never in the way ─────────────────────────
function TechDetail({ site }: { site: SiteStatus }) {
  const running = site.services.filter((s) => s.deployment !== 'not-deployed');
  return (
    <div className="space-y-3 pt-2">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Background services</p>
        {running.length === 0
          ? <p className="text-sm text-muted-foreground">None running for this property.</p>
          : running.map((s: ServiceCell) => (
            <div key={s.name} className="flex items-center gap-2.5 py-1 text-sm">
              <span className={cn('h-2 w-2 rounded-full shrink-0', dot(s.status))} />
              <span className="flex-1 min-w-0 truncate">{s.name}</span>
              <span className="text-xs text-muted-foreground font-mono hidden sm:block">{s.container}:{s.port}</span>
              <span className="text-xs text-muted-foreground w-14 text-right">{s.latencyMs == null ? '—' : `${s.latencyMs}ms`}</span>
              <span className={cn('text-xs w-24 text-right', tone(s.status))}>{WORDS[s.status]}</span>
            </div>
          ))}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Can Google find it?</p>
        <Findability seo={site.seo} />
      </div>
    </div>
  );
}

// ── A property that needs attention ───────────────────────────────────────────
function ProblemCard({ site, problems }: { site: SiteStatus; problems: ReturnType<typeof problemsFor> }) {
  const [showTech, setShowTech] = useState(false);
  const worst = problems.some((p) => p.severity === 'bad') ? 'bad' : 'warn';
  const oldest = site.incidents.length
    ? site.incidents.reduce((a, b) => (new Date(a.opened_at) < new Date(b.opened_at) ? a : b))
    : null;

  return (
    <Card className={cn('border-l-4', worst === 'bad' ? 'border-l-red-500' : 'border-l-amber-500')}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* A div, not a p: Badge renders a div, and a div inside a p is invalid HTML that
                React reports as a hydration error in the console. */}
            <div className="font-semibold flex items-center gap-2 flex-wrap">
              {site.name}
              {site.rails.length > 0 && <Badge variant="outline" className="text-[10px] font-normal">takes payments</Badge>}
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">{site.domain}</p>
          </div>
          {oldest && (
            <p className="text-xs text-muted-foreground shrink-0 text-right leading-tight">
              started<br />{ago(oldest.opened_at)} ago
            </p>
          )}
        </div>

        <ul className="space-y-1.5">
          {problems.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {p.severity === 'bad'
                ? <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
              <span className="min-w-0">
                <span className="font-medium">{p.text}</span>
                {p.detail && <span className="text-muted-foreground"> — {p.detail}</span>}
              </span>
            </li>
          ))}
        </ul>

        <Checklist site={site} />

        <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2 text-xs text-muted-foreground"
          onClick={() => setShowTech((v) => !v)}>
          {showTech ? <ChevronDown className="h-3.5 w-3.5 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
          {showTech ? 'Hide technical detail' : 'Show technical detail'}
        </Button>
        {showTech && <TechDetail site={site} />}
      </CardContent>
    </Card>
  );
}

// ── A property that is fine ───────────────────────────────────────────────────
function HealthyRow({ site }: { site: SiteStatus }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 py-2.5 px-2 text-left hover:bg-muted/40 rounded">
        <span className={cn('h-2 w-2 rounded-full shrink-0', dot(site.overall))} />
        <span className="font-medium text-sm flex-1 min-w-0 truncate">{site.name}</span>
        <span className="text-xs text-muted-foreground font-mono hidden md:block truncate max-w-[16rem]">{site.domain}</span>
        <span className={cn('text-xs shrink-0', site.siteStatus === 'live' ? 'text-emerald-600' : 'text-muted-foreground')}>
          {site.siteStatus === 'live' ? 'All good' : WORDS[site.overall]}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-2 pb-3">
          <Checklist site={site} />
          <TechDetail site={site} />
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StatusPage() {
  const { setBreadcrumbs } = useUIStore();
  const live = useRealtimeStore((s) => s.siteStatus) as StatusRollup | null;
  const wsState = useRealtimeStore((s) => s.wsState);
  const [showAllHealthy, setShowAllHealthy] = useState(false);

  useEffect(() => { setBreadcrumbs([{ label: 'Mission Control' }]); }, [setBreadcrumbs]);

  const { data: polled, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['status-rollup'],
    queryFn: async () => (await statusApi.rollup()).data.data,
    refetchInterval: 30_000,
    retry: false,
  });
  const testAlert = useMutation({ mutationFn: async () => (await statusApi.testAlert()).data });

  const rollup: StatusRollup | null = live ?? polled ?? null;

  if (isLoading && !rollup) {
    return (
      <div className="space-y-4">
        <PageHeader title="Mission Control" description="Everything you own, in one place." />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  if (error && !rollup) {
    return (
      <div className="space-y-4">
        <PageHeader title="Mission Control" description="Everything you own, in one place." />
        <Card><CardContent className="pt-6 text-sm space-y-2">
          <p className="font-medium">Can&apos;t load the status board.</p>
          <p className="text-muted-foreground">
            The admin service may be unreachable, or the checker may be switched off
            (<code className="rounded bg-muted px-1 py-0.5 text-xs">STATUS_PROBER=true</code>).
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Try again</Button>
        </CardContent></Card>
      </div>
    );
  }

  const sites = rollup?.sites ?? [];
  const alerting = rollup?.alerting;

  // When one fault hits most properties at once it is ONE problem, not eighteen — the server is
  // down, or the checker cannot reach it. Repeating the same card per property buries whatever
  // is genuinely wrong with a single site. Same reasoning as the digest on the alerts.
  const perSite = sites.map((s) => ({ site: s, problems: problemsFor(s) }));
  const affected = perSite.filter((x) => x.problems.length > 0);
  const kindOf = (text: string) => (/background services/.test(text) ? 'services'
    : /database/i.test(text) ? 'database'
      : /Google finding/.test(text) ? 'seo'
        : /sign in/i.test(text) ? 'auth'
          : /website/i.test(text) ? 'website' : 'payments');
  const counts = new Map<string, number>();
  for (const { problems } of perSite) {
    for (const k of new Set(problems.map((p) => kindOf(p.text)))) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  // "Most" = more than 60% of properties, and at least three of them.
  const widespread = new Set(
    [...counts.entries()].filter(([, n]) => n >= 3 && n > sites.length * 0.6).map(([k]) => k),
  );
  const estateWide = [...widespread].map((kind) => {
    const hit = perSite.filter((x) => x.problems.some((p) => kindOf(p.text) === kind));
    return { kind, count: hit.length, example: hit[0]?.problems.find((p) => kindOf(p.text) === kind) };
  });

  // Each property keeps only the problems that are specific to it.
  const scoped = perSite.map((x) => ({ ...x, problems: x.problems.filter((p) => !widespread.has(kindOf(p.text))) }));
  const needsAttention = scoped.filter((x) => x.problems.length > 0).map((x) => x.site);
  const healthy = scoped.filter((x) => x.problems.length === 0).map((x) => x.site);
  const criticalCount = scoped.filter((x) => x.problems.some((p) => p.severity === 'bad')).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mission Control"
        description="Everything you own, in one place."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={() => testAlert.mutate()}
              disabled={testAlert.isPending || !alerting?.configured}
              title={alerting?.configured ? 'Send a test notification to your phone' : 'No notification topic set yet'}>
              <BellRing className="h-3.5 w-3.5 mr-1.5" />
              {testAlert.isPending ? 'Sending…' : 'Test my phone'}
            </Button>
          </div>
        }
      />

      {/* The answer first, in one sentence, before any detail. */}
      <Card className={cn('border-l-4', criticalCount || estateWide.length ? 'border-l-red-500' : needsAttention.length ? 'border-l-amber-500' : 'border-l-emerald-500')}>
        <CardContent className="py-5">
          <div className="flex items-start gap-3">
            {needsAttention.length === 0 && estateWide.length === 0
              ? <CheckCircle2 className="h-7 w-7 text-emerald-500 shrink-0" />
              : <AlertTriangle className={cn('h-7 w-7 shrink-0', criticalCount || estateWide.length ? 'text-red-500' : 'text-amber-500')} />}
            <div className="min-w-0">
              <p className="text-xl font-semibold">
                {estateWide.length > 0
                  ? `Something is wrong across ${affected.length} of ${sites.length} properties`
                  : needsAttention.length === 0
                    ? `All ${sites.length} properties are healthy`
                    : `${needsAttention.length} of ${sites.length} properties need you`}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {estateWide.length > 0
                  ? 'Start with the shared cause below — fixing it will likely clear most of these.'
                  : needsAttention.length === 0
                    ? 'Nothing needs your attention right now.'
                    : criticalCount > 0
                      ? `${criticalCount} ${criticalCount === 1 ? 'is' : 'are'} seriously broken. The rest are warnings.`
                      : 'Nothing is down — these are warnings worth fixing.'}
                {rollup?.lastSweepAt && <> · Checked {ago(rollup.lastSweepAt)} ago</>}
                {wsState === 'connected' && <> · updating live</>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Whether we can actually reach you — said once, near the top, in your words. */}
      {alerting && !alerting.configured && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-4 flex items-start gap-3 text-sm">
            <BellOff className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">If something breaks, your phone won&apos;t ring.</p>
              <p className="text-muted-foreground">
                Problems are recorded on this page, but no notification is sent anywhere yet. Set a
                notification topic on the admin service, then press &ldquo;Test my phone&rdquo;.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {alerting?.configured && !alerting.heartbeat && (
        <Card>
          <CardContent className="py-4 flex items-start gap-3 text-sm">
            <HeartPulse className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">If this whole server dies, nothing will tell you.</p>
              <p className="text-muted-foreground">
                The checker runs on this server, so it cannot report its own death. Point
                <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">STATUS_HEARTBEAT_URL</code>
                at an outside monitor, and silence becomes the alarm.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {testAlert.data && (
        <p className={cn('text-sm', testAlert.data.success ? 'text-emerald-600' : 'text-red-600')}>
          {testAlert.data.success ? 'Sent — check your phone.' : `Couldn't send: ${testAlert.data.data?.error ?? 'unknown error'}`}
        </p>
      )}

      {estateWide.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="py-4 space-y-2">
            <p className="font-semibold text-sm">Affecting nearly everything</p>
            {estateWide.map((e) => (
              <div key={e.kind} className="flex items-start gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span className="min-w-0">
                  <span className="font-medium">{e.example?.text}</span>
                  <span className="text-muted-foreground"> — on {e.count} of {sites.length} properties.</span>
                  <span className="text-muted-foreground">
                    {' '}That is usually one cause, not {e.count} separate faults: the server is down,
                    or this checker cannot reach it.
                  </span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {needsAttention.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Needs your attention</h2>
          {needsAttention.map((site) => (
            <ProblemCard key={site.id} site={site}
              problems={scoped.find((x) => x.site.id === site.id)!.problems} />
          ))}
        </section>
      )}

      {healthy.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {estateWide.length > 0 ? `Nothing else specific to these (${healthy.length})` : `Working normally (${healthy.length})`}
          </h2>
          <Card><CardContent className="py-1">
            {(showAllHealthy ? healthy : healthy.slice(0, 6)).map((site) => <HealthyRow key={site.id} site={site} />)}
            {healthy.length > 6 && (
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground my-1"
                onClick={() => setShowAllHealthy((v) => !v)}>
                {showAllHealthy ? 'Show fewer' : `Show ${healthy.length - 6} more`}
              </Button>
            )}
          </CardContent></Card>
        </section>
      )}

      {sites.length === 0 && (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">No properties registered yet.</CardContent></Card>
      )}
    </div>
  );
}
