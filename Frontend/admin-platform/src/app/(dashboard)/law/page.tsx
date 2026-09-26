'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ExternalLink, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients } from '@/lib/api/client';
import { HOME_WIDGETS, lawOverviewApi, type LawOverview } from '@/lib/law/legal';

function extractRows(d: unknown): Record<string, unknown>[] {
  const env = d as { data?: unknown } | undefined;
  const x = (env && 'data' in env ? env.data : env) as unknown;
  if (Array.isArray(x)) return x as Record<string, unknown>[];
  const items = (x as { items?: unknown })?.items;
  return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
}

function LawyerAccounts() {

  const { data, isLoading } = useQuery({
    queryKey: ['law', 'lawyers'],
    queryFn: () => serviceClients.law.get('/lawyers', { params: { limit: 50 } }).then((r) => r.data),
  });
  const lawyers = extractRows(data);

  return (
    <div>
      <Card>
        <CardHeader><CardTitle>Lawyers ({lawyers.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : lawyers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No lawyers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Practice Area</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {lawyers.map((l, i) => (
                    <tr key={String(l.id ?? i)} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{String(l.name ?? l.full_name ?? '—')}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{String(l.specialization ?? l.practice_area ?? l.email ?? '—')}</td>
                      <td className="py-2 pr-4">
                        <Badge className={l.verified || l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {String(l.status ?? (l.verified ? 'verified' : 'pending'))}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const labelOf = (k: string) => HOME_WIDGETS.find((w) => w.kind === k)?.label ?? k;

interface Alert { tone: 'warn' | 'info'; text: string; href: string; cta: string }

/** What an editor should look at first, derived from the counts. Ordered by how urgent it is. */
function attention(o: LawOverview): Alert[] {
  const out: Alert[] = [];
  for (const w of o.widgets) {
    if (w.lapsed > 0) out.push({ tone: 'warn', text: `${w.lapsed} ${labelOf(w.widget).toLowerCase()} ${w.lapsed === 1 ? 'entry has' : 'entries have'} expired but ${w.lapsed === 1 ? 'is' : 'are'} still marked published. Archive ${w.lapsed === 1 ? 'it' : 'them'}.`, href: '/law/home-widgets', cta: 'Review' });
  }
  for (const w of o.widgets) {
    if (w.expiringSoon > 0) out.push({ tone: 'warn', text: `${w.expiringSoon} ${labelOf(w.widget).toLowerCase()} ${w.expiringSoon === 1 ? 'entry expires' : 'entries expire'} within 24 hours.`, href: '/law/home-widgets', cta: 'Review' });
  }
  for (const s of o.sections) {
    if (s.unverified > 0) out.push({ tone: 'warn', text: `${s.unverified} published ${s.label.toLowerCase()} ${s.unverified === 1 ? 'entry has' : 'entries have'} no editor sign-off yet.`, href: s.href, cta: 'Check' });
  }
  const drafts = o.sections.reduce((n, s) => n + s.draft, 0) + o.widgets.reduce((n, w) => n + w.drafts, 0);
  if (drafts > 0) out.push({ tone: 'info', text: `${drafts} ${drafts === 1 ? 'draft is' : 'drafts are'} waiting to be published or archived.`, href: '/law/home-widgets', cta: 'Open' });
  return out;
}

export default function LawAdminPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite' }]); }, [setBreadcrumbs]);
  const { data, isLoading, isError } = useQuery({ queryKey: ['law', 'overview'], queryFn: () => lawOverviewApi.get(), refetchInterval: 60_000 });
  const alerts = data ? attention(data) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Law Elite Network"
        description="What is live on lawelitenetwork.com, what needs an editor, and what is about to lapse."
        actions={<div className="flex gap-2"><Button asChild variant="outline"><a href="https://lawelitenetwork.com" target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> View site</a></Button><Button asChild><Link href="/law/home-widgets/new"><Plus className="mr-2 h-4 w-4" /> New homepage entry</Link></Button></div>}
      />

      {isError ? (
        <Card><CardContent className="py-10 text-center text-sm text-red-600">Could not load the overview. Is law-service running and are you signed in as an admin?</CardContent></Card>
      ) : isLoading || !data ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Needs attention</CardTitle></CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-green-600" /> Nothing needs attention right now.</p>
              ) : (
                <ul className="divide-y">
                  {alerts.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                      <span className="flex items-start gap-2"><AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${a.tone === 'warn' ? 'text-amber-600' : 'text-muted-foreground'}`} />{a.text}</span>
                      <Button asChild variant="ghost" size="sm"><Link href={a.href}>{a.cta}</Link></Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Content</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.sections.map((s) => (
                <Link key={s.key} href={s.href} className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50">
                  <div className="text-2xl font-semibold">{s.published}</div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    published{s.draft > 0 ? ` · ${s.draft} draft` : ''}{s.archived > 0 ? ` · ${s.archived} archived` : ''}
                  </div>
                </Link>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Counts are records managed here. Anything not listed still shows from the website’s built-in content.</p>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Homepage widgets</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="px-6 py-2 font-medium">Widget</th><th className="py-2 pr-4 font-medium">Live</th><th className="py-2 pr-4 font-medium">Drafts</th><th className="py-2 pr-4 font-medium">Expiring in 24h</th><th className="px-6 py-2 font-medium">On the homepage</th>
                </tr></thead>
                <tbody>
                  {data.widgets.map((w) => (
                    <tr key={w.widget} className="border-b last:border-0">
                      <td className="px-6 py-2.5 font-medium">{labelOf(w.widget)}</td>
                      <td className="py-2.5 pr-4">{w.live}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{w.drafts}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{w.expiringSoon}</td>
                      <td className="px-6 py-2.5">{w.live > 0 ? <Badge className="bg-green-100 text-green-700">Showing</Badge> : <Badge className="bg-gray-100 text-gray-600">Hidden (no live entries)</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      <details className="rounded-lg border">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">Lawyer accounts</summary>
        <div className="border-t p-4"><LawyerAccounts /></div>
      </details>
    </div>
  );
}
