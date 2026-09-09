'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Gauge, Clock, Timer, Mail, AlertTriangle, Play, Save, Radio, ShieldCheck, CalendarClock,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/lib/store/uiStore';
import { usePolicy, useQuota, useSavePolicy, useRunIntake } from '@/lib/queries/editorial.queries';
import type { PublicationPolicy, CategoryMixEntry } from '@/lib/types/editorial.types';

const DAYS = [
  { n: 1, label: 'Mon' }, { n: 2, label: 'Tue' }, { n: 3, label: 'Wed' }, { n: 4, label: 'Thu' },
  { n: 5, label: 'Fri' }, { n: 6, label: 'Sat' }, { n: 7, label: 'Sun' },
];

/** Volume presets, so the common cases are one click rather than four fields. */
const PRESETS = [
  { label: '3 a day', dailyTarget: 3, dailyMax: 5, hourlyMax: 1, minMinutesBetweenPosts: 120 },
  { label: '6 a day', dailyTarget: 6, dailyMax: 10, hourlyMax: 2, minMinutesBetweenPosts: 45 },
  { label: '10 a day', dailyTarget: 10, dailyMax: 14, hourlyMax: 3, minMinutesBetweenPosts: 30 },
  { label: '1 an hour', dailyTarget: 12, dailyMax: 24, hourlyMax: 1, minMinutesBetweenPosts: 60 },
];

function NumberField({
  label, hint, value, onChange, min, max, suffix,
}: {
  label: string; hint?: string; value: number; onChange: (n: number) => void;
  min?: number; max?: number; suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-8 w-24 font-mono text-sm"
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function EditorialRulesPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();

  const { data: policyData, isLoading } = usePolicy(websiteId);
  const { data: quota } = useQuota(websiteId);
  const savePolicy = useSavePolicy(websiteId);
  const runIntake = useRunIntake(websiteId);

  const [draft, setDraft] = useState<Partial<PublicationPolicy> | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'CMS', href: '/cms' }, { label: 'Websites', href: '/cms/websites' }, { label: 'Publication rules' }]);
  }, [setBreadcrumbs]);

  // Seed the editable draft once the server value arrives, and only then — a
  // controlled form seeded from an undefined query flashes empty inputs.
  useEffect(() => {
    if (policyData?.policy && !draft) setDraft(policyData.policy);
  }, [policyData, draft]);

  const categories = policyData?.categories ?? [];
  const deadCategories = useMemo(() => categories.filter((c) => !c.routeAlive), [categories]);

  const set = <K extends keyof PublicationPolicy>(key: K, value: PublicationPolicy[K]) =>
    setDraft((d) => ({ ...(d ?? {}), [key]: value }));

  const applyPreset = (p: (typeof PRESETS)[number]) =>
    setDraft((d) => ({
      ...(d ?? {}),
      dailyTarget: p.dailyTarget,
      dailyMax: p.dailyMax,
      hourlyMax: p.hourlyMax,
      minMinutesBetweenPosts: p.minMinutesBetweenPosts,
    }));

  const mix: CategoryMixEntry[] = draft?.categoryMix ?? [];
  const mixTotal = mix.reduce((sum, m) => sum + (Number(m.targetPct) || 0), 0);

  const updateMix = (slug: string, patch: Partial<CategoryMixEntry>) =>
    set('categoryMix', mix.map((m) => (m.categorySlug === slug ? { ...m, ...patch } : m)));

  const toggleBeat = (slug: string, label: string, on: boolean) =>
    set('categoryMix', on
      ? [...mix, { categorySlug: slug, label, targetPct: 0, minPerDay: 0, maxPerDay: 3 }]
      : mix.filter((m) => m.categorySlug !== slug));

  const windows = draft?.publishWindows ?? [];
  const toggleWindowDay = (idx: number, day: number) =>
    set('publishWindows', windows.map((w, i) => i !== idx ? w : {
      ...w,
      days: w.days.includes(day) ? w.days.filter((d) => d !== day) : [...w.days, day].sort(),
    }));

  const emails = draft?.notifyEmails ?? [];
  const autoPublishBlocked = (draft?.autoPublishEnabled ?? false) && emails.length === 0;

  if (isLoading || !draft) {
    return (
      <div className="space-y-6">
        <PageHeader title="Publication rules" description="How much this site publishes, when, and across which beats" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publication rules"
        description="How much this site publishes, when, across which beats — and whether it may publish itself"
      />

      {/* Live state first: what the rules are actually doing today. */}
      {quota && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4" /> Today
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold">{quota.publishedToday}<span className="text-base font-normal text-muted-foreground"> / {quota.dailyTarget}</span></p>
              <p className="text-xs text-muted-foreground">published today (ceiling {quota.hardCeiling})</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{quota.state.publishedLastHour}</p>
              <p className="text-xs text-muted-foreground">in the last hour</p>
            </div>
            <Badge variant="outline" className={quota.windowOpen ? 'border-emerald-500/40 text-emerald-400' : 'border-amber-500/40 text-amber-400'}>
              {quota.windowOpen ? `Window open${quota.currentWindow ? ` — ${quota.currentWindow.label}` : ''}` : 'Outside publishing window'}
            </Badge>
            <Badge variant="outline" className={quota.autoPublishEnabled ? 'border-blue-500/40 text-blue-400' : 'border-muted-foreground/30'}>
              {quota.autoPublishEnabled ? `Auto-publish on — ${quota.autoPublishDelayMinutes} min hold` : 'Auto-publish off'}
            </Badge>
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => runIntake.mutate()} disabled={runIntake.isPending}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {runIntake.isPending ? 'Scanning wire…' : 'Scan wire now'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Volume */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><Radio className="h-4 w-4" /> How much</CardTitle>
          <CardDescription>
            The target is what the desk aims for; the ceiling is a hard stop — publishing is refused above it, not warned about.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.label} size="sm" variant="outline" onClick={() => applyPreset(p)}>{p.label}</Button>
            ))}
          </div>
          <Separator />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <NumberField label="Articles per day (target)" value={draft.dailyTarget ?? 0} min={0} max={200}
              onChange={(n) => set('dailyTarget', n)} />
            <NumberField label="Hard daily ceiling" hint="Approval is refused above this." value={draft.dailyMax ?? 0} min={1} max={300}
              onChange={(n) => set('dailyMax', n)} />
            <NumberField label="Max per hour" hint="Stops a backlog landing all at once." value={draft.hourlyMax ?? 0} min={1} max={60}
              onChange={(n) => set('hourlyMax', n)} />
            <NumberField label="Minimum gap" suffix="minutes" value={draft.minMinutesBetweenPosts ?? 0} min={0} max={720}
              onChange={(n) => set('minMinutesBetweenPosts', n)} />
            <NumberField label="Weekend volume" suffix="% of weekday" hint="Real desks run lighter at weekends."
              value={draft.weekendTargetPct ?? 0} min={0} max={200} onChange={(n) => set('weekendTargetPct', n)} />
            <NumberField label="Max bylines per author per day" hint="One name carrying implausible volume is the clearest tell."
              value={draft.maxArticlesPerAuthorPerDay ?? 0} min={1} max={50} onChange={(n) => set('maxArticlesPerAuthorPerDay', n)} />
          </div>
        </CardContent>
      </Card>

      {/* Auto-publish */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><Timer className="h-4 w-4" /> Auto-publish</CardTitle>
          <CardDescription>
            Only a draft that passed every machine gate can start a timer. Anything with a failed check waits for a person,
            however long that takes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Publish automatically after the hold window</p>
              <p className="text-xs text-muted-foreground">
                You get an email when articles are ready. If you do nothing, they go out. Clicking hold, editing or rejecting stops it.
              </p>
            </div>
            <Switch checked={draft.autoPublishEnabled ?? false} onCheckedChange={(v) => set('autoPublishEnabled', v)} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField label="Hold window" suffix="minutes" hint="How long you have to veto before it publishes."
              value={draft.autoPublishDelayMinutes ?? 10} min={1} max={1440}
              onChange={(n) => set('autoPublishDelayMinutes', n)} />
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium"><Mail className="h-3 w-3" /> Notify these addresses</Label>
              <Input
                value={emails.join(', ')}
                placeholder="you@example.com, editor@example.com"
                onChange={(e) => set('notifyEmails', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                className="h-8 text-sm"
              />
              <p className="text-[11px] leading-snug text-muted-foreground">Comma separated. One digest per run, not one mail per article.</p>
            </div>
          </div>

          {autoPublishBlocked && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <p>
                Auto-publish is on but no address is set. A timer with nobody notified is not a veto window — it is just publishing.
                No timer will be armed until you add a recipient.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Beat distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4" /> Beat distribution</CardTitle>
          <CardDescription>
            The planner fills under-served beats first, so the day spreads across the site instead of piling onto whatever the wire was loudest about.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {deadCategories.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
              <p>
                <span className="font-medium">{deadCategories.length} categor{deadCategories.length === 1 ? 'y has' : 'ies have'} no working public route</span>
                {' '}({deadCategories.map((c) => c.slug).join(', ')}). They exist in the CMS but the site redirects or 404s them,
                so anything published there is unreachable. They cannot be added to the mix.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {categories.map((c) => {
              const entry = mix.find((m) => m.categorySlug === c.slug);
              const on = Boolean(entry);
              return (
                <div key={c.id} className={`flex flex-wrap items-center gap-3 rounded-md border p-2.5 ${c.routeAlive ? '' : 'opacity-50'}`}>
                  <Switch checked={on} disabled={!c.routeAlive} onCheckedChange={(v) => toggleBeat(c.slug, c.name, v)} />
                  <span className="min-w-[9rem] text-sm font-medium">{c.name}</span>
                  <code className="text-[11px] text-muted-foreground">/{c.slug}</code>
                  {!c.routeAlive && <Badge variant="outline" className="border-red-500/40 text-[10px] text-red-400">dead route</Badge>}
                  {on && entry && (
                    <div className="ml-auto flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        share
                        <Input type="number" min={0} max={100} value={entry.targetPct} className="h-7 w-16 font-mono text-xs"
                          onChange={(e) => updateMix(c.slug, { targetPct: Number(e.target.value) })} />%
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        max/day
                        <Input type="number" min={0} max={50} value={entry.maxPerDay} className="h-7 w-16 font-mono text-xs"
                          onChange={(e) => updateMix(c.slug, { maxPerDay: Number(e.target.value) })} />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {mix.length > 0 && (
            <p className={`text-xs ${mixTotal === 100 ? 'text-muted-foreground' : 'text-amber-500'}`}>
              Shares total {mixTotal}%{mixTotal !== 100 ? ' — they should add up to 100 for the planner to distribute cleanly.' : '.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Windows */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><CalendarClock className="h-4 w-4" /> Publishing windows</CardTitle>
          <CardDescription>Hours are UTC. Outside every window, publishing is held for the next one rather than refused outright.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {windows.length === 0 && <p className="text-xs text-muted-foreground">No windows set — the site may publish at any hour.</p>}
          {windows.map((w, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 rounded-md border p-2.5">
              <Input value={w.label} className="h-7 w-40 text-xs"
                onChange={(e) => set('publishWindows', windows.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <Input type="number" min={0} max={23} value={w.startHourUtc} className="h-7 w-14 font-mono text-xs"
                  onChange={(e) => set('publishWindows', windows.map((x, j) => j === i ? { ...x, startHourUtc: Number(e.target.value) } : x))} />
                to
                <Input type="number" min={0} max={23} value={w.endHourUtc} className="h-7 w-14 font-mono text-xs"
                  onChange={(e) => set('publishWindows', windows.map((x, j) => j === i ? { ...x, endHourUtc: Number(e.target.value) } : x))} />
                UTC
              </div>
              <div className="flex gap-1">
                {DAYS.map((d) => (
                  <button key={d.n} type="button" onClick={() => toggleWindowDay(i, d.n)}
                    className={`rounded px-1.5 py-0.5 text-[11px] ${w.days.includes(d.n) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={() => savePolicy.mutate(draft)} disabled={savePolicy.isPending}>
          <Save className="mr-1.5 h-4 w-4" />
          {savePolicy.isPending ? 'Saving…' : 'Save publication rules'}
        </Button>
        <Link href={`/cms/websites/${websiteId}`} className="text-sm text-muted-foreground hover:underline">
          Back to site
        </Link>
      </div>
    </div>
  );
}
