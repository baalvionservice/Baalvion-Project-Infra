'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DownloadCloud, ExternalLink, FileText, Pencil, Plus, Search, Undo2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/lib/store/uiStore';
import { useDebounced } from '@/lib/hooks/useDebounced';
import { homeWidgetsApi, homeSourcesApi, ingestHomeWidgets, lawArticleTargets, startArticleFromItem, REGION_NAMES, type CmsCategoryOption, HOME_WIDGETS, regionLabel, timeAgo, expiresIn, rowsOf, type HomeWidgetRecord, type IngestReport, type CountryStat } from '@/lib/law/legal';

const SELECT = 'h-9 rounded-md border border-input bg-background px-3 text-sm';
const PAGE = 50;
const labelOf = (k: string) => HOME_WIDGETS.find((w) => w.kind === k)?.label ?? k;
const isExpired = (r: HomeWidgetRecord) => !!r.expires_at && new Date(r.expires_at).getTime() <= Date.now();
const byNewest = (a: HomeWidgetRecord, b: HomeWidgetRecord) => new Date(b.event_at ?? b.updated_at ?? 0).getTime() - new Date(a.event_at ?? a.updated_at ?? 0).getTime();

type Undo = { id: number; label: string; revert: Partial<HomeWidgetRecord> };

/** One item awaiting a decision. Two clear outcomes: a short strip on the homepage, or a full article written in the CMS. Skip drops it. */
function ReviewCard({ item, busy, articles, onPublish, onSkip, onWrite }: {
  item: HomeWidgetRecord; busy: boolean;
  articles: { categories: CmsCategoryOption[] } | null;
  onPublish: (title: string, summary: string) => void; onSkip: () => void;
  onWrite: (title: string, summary: string, categoryId: string) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [summary, setSummary] = useState(item.summary ?? '');
  const [categoryId, setCategoryId] = useState('');
  const expired = isExpired(item);
  const region = regionLabel(item.region ?? item.extra?.region);
  const started = item.extra?.cms_content_id && item.extra?.cms_website_id ? `/cms/websites/${item.extra.cms_website_id}/content/${item.extra.cms_content_id}` : null;
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {region && <Badge className="bg-slate-100 text-slate-700">{region}</Badge>}
        {item.widget !== 'breaking' && <Badge className="bg-slate-100 text-slate-700">{labelOf(item.widget)}</Badge>}
        {started && <Badge className="bg-blue-100 text-blue-700">Article started</Badge>}
        <span className="font-medium text-foreground">{item.source_name}</span>
        {item.event_at && <span>· {timeAgo(item.event_at)}</span>}
        {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-blue-700 hover:underline">Read the original <ExternalLink className="h-3 w-3" /></a>}
      </div>
      <label className="sr-only" htmlFor={`t-${item.id}`}>Headline</label>
      <Input id={`t-${item.id}`} value={title} maxLength={300} onChange={(e) => setTitle(e.target.value)} className="font-medium" />
      <p className="mt-1 text-xs text-muted-foreground">Reword the headline in your own words before using it.</p>
      <label className="sr-only" htmlFor={`s-${item.id}`}>Summary</label>
      <Input id={`s-${item.id}`} className="mt-2" placeholder="One-line summary in your own words (optional)" value={summary} maxLength={2000} onChange={(e) => setSummary(e.target.value)} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={busy || expired || !title.trim()} onClick={() => onPublish(title.trim(), summary.trim())}>{busy ? 'Working…' : 'Publish to homepage'}</Button>
        {started ? (
          <Button asChild size="sm" variant="outline"><Link href={started}><FileText className="mr-1 h-3.5 w-3.5" /> Open the article draft</Link></Button>
        ) : articles ? (
          <>
            <select className={`${SELECT} h-8 text-xs`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Article category">
              <option value="">Category (choose in editor)</option>
              {articles.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Button size="sm" variant="outline" disabled={busy || !title.trim()} onClick={() => onWrite(title.trim(), summary.trim(), categoryId)}><FileText className="mr-1 h-3.5 w-3.5" /> Write full article</Button>
          </>
        ) : null}
        <Button size="sm" variant="ghost" disabled={busy} onClick={onSkip}>Skip</Button>
        <Button asChild size="sm" variant="ghost"><Link href={`/law/home-widgets/${item.id}`}><Pencil className="mr-1 h-3.5 w-3.5" /> More options</Link></Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {expired ? 'Too old to publish as breaking news. Skip it, or write an article instead.' : 'Homepage = a short strip with your headline. Full article = opens the editor with the source attached; you write it, then publish it as a post. Only categories the website shows are offered here.'}
        {!expired && item.expires_at && ` If published to the homepage, ${expiresIn(item.expires_at)}.`}
      </p>
    </div>
  );
}

export default function HomeWidgetsPage() {
  const { setBreadcrumbs } = useUIStore();
  const qc = useQueryClient();
  const router = useRouter();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Homepage' }]); }, [setBreadcrumbs]);
  // The CMS may be unavailable or the site not set up: then the article button is simply not offered.
  const targets = useQuery({ queryKey: ['law', 'article-targets'], queryFn: lawArticleTargets, retry: false, staleTime: 5 * 60_000 });

  const [report, setReport] = useState<IngestReport | null>(null);
  const [notice, setNotice] = useState<{ text: string; undo?: Undo } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [country, setCountry] = useState('');

  const review = useQuery({ queryKey: ['law', 'home-widgets', 'review'], queryFn: () => homeWidgetsApi.list({ page: 1, limit: 100, published: false, archived: false }) });
  const live = useQuery({ queryKey: ['law', 'home-widgets', 'live'], queryFn: () => homeWidgetsApi.list({ page: 1, limit: 100, published: true, archived: false }), refetchInterval: 60_000 });
  const sources = useQuery({ queryKey: ['law', 'home-widgets', 'sources'], queryFn: () => homeSourcesApi.get(), refetchInterval: 60_000 });
  const regionOf = (r: HomeWidgetRecord) => r.region ?? r.extra?.region ?? null;
  const inCountry = (r: HomeWidgetRecord) => !country || (country === 'hand' ? !regionOf(r) : regionOf(r) === country);
  const toReview = rowsOf<HomeWidgetRecord>(review.data).filter(inCountry).sort(byNewest);
  const onSite = rowsOf<HomeWidgetRecord>(live.data).filter((r) => !isExpired(r)).filter(inCountry).sort(byNewest);
  const refresh = () => qc.invalidateQueries({ queryKey: ['law'] });

  const fetchNow = useMutation({
    mutationFn: ingestHomeWidgets,
    onSuccess: (r) => { setReport(r); setError(null); setNotice(null); refresh(); },
    onError: () => { setReport(null); setError('Could not reach the official sources. Try again in a few minutes.'); },
  });

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<HomeWidgetRecord>; text: string; undo?: Undo }) => { setBusyId(id); return homeWidgetsApi.update(id, body); },
    onSuccess: (_r, v) => { setError(null); setNotice({ text: v.text, undo: v.undo }); refresh(); },
    onError: (e) => setError((e as { message?: string })?.message || 'That did not save. Please try again.'),
    onSettled: () => setBusyId(null),
  });

  const publish = (i: HomeWidgetRecord, title: string, summary: string) => patch.mutate({
    id: i.id, body: { title, summary, published: true }, text: `Published “${title}”. It shows on the homepage within about a minute.`,
    undo: { id: i.id, label: 'Unpublish', revert: { published: false } },
  });
  const skip = (i: HomeWidgetRecord) => patch.mutate({ id: i.id, body: { archived: true }, text: `Skipped “${i.title}”.`, undo: { id: i.id, label: 'Undo', revert: { archived: false } } });
  const takeDown = (i: HomeWidgetRecord) => patch.mutate({ id: i.id, body: { archived: true }, text: `Took down “${i.title}”.`, undo: { id: i.id, label: 'Undo', revert: { archived: false } } });

  const writeArticle = useMutation({
    mutationFn: async (v: { item: HomeWidgetRecord; title: string; summary: string; categoryId: string }) => {
      setBusyId(v.item.id);
      return startArticleFromItem(v.item, { websiteId: targets.data!.websiteId, categoryId: v.categoryId, title: v.title, summary: v.summary });
    },
    onSuccess: (r) => { refresh(); router.push(`/cms/websites/${r.websiteId}/content/${r.contentId}`); },
    onError: (e) => setError((e as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response?.data?.error?.message || (e as Error)?.message || 'Could not start the article. Please try again.'),
    onSettled: () => setBusyId(null),
  });

  const fetchedCount = report?.created ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage"
        description="Fetch the latest, publish what is good, skip the rest. It takes a few minutes a day."
        actions={<div className="flex gap-2"><Button variant="outline" asChild><Link href="/law/home-widgets/new"><Plus className="mr-2 h-4 w-4" /> Add your own</Link></Button><Button onClick={() => fetchNow.mutate()} disabled={fetchNow.isPending}><DownloadCloud className="mr-2 h-4 w-4" /> {fetchNow.isPending ? 'Fetching…' : 'Fetch latest'}</Button></div>}
      />

      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <span>{notice.text}</span>
          {notice.undo && <Button size="sm" variant="ghost" onClick={() => { const u = notice.undo!; patch.mutate({ id: u.id, body: u.revert, text: 'Undone.' }); }}><Undo2 className="mr-1 h-3.5 w-3.5" /> {notice.undo.label}</Button>}
        </div>
      )}
      {report && (
        <div role="status" className="rounded-md border bg-muted/50 px-4 py-3 text-sm">
          {fetchedCount > 0 ? `${fetchedCount} new ${fetchedCount === 1 ? 'item' : 'items'} to review below.` : 'Nothing new right now. Official sources only publish so often, and older items are skipped. Try again later.'}
          {report.sources.some((s) => s.error) && <span className="block text-amber-700">Could not read: {report.sources.filter((s) => s.error).map((s) => s.label).join(', ')}.</span>}
          <span className="block text-xs text-muted-foreground">Checked {report.sources.length} official sources across the US, UK, Kenya, the UN and the ICC.</span>
        </div>
      )}

      <section aria-labelledby="review-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="review-h" className="text-base font-semibold">To review {review.data && <span className="text-muted-foreground">({toReview.length})</span>}</h2>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">Country
            <select className={SELECT} value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Filter by country">
              <option value="">All countries</option>
              {(sources.data?.countries ?? []).map((c) => <option key={c.region} value={c.region}>{regionLabel(c.region)}</option>)}
              <option value="hand">Added by hand</option>
            </select>
          </label>
        </div>
        {review.isLoading ? (
          <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}</div>
        ) : review.isError ? (
          <p className="rounded-lg border py-10 text-center text-sm text-red-600">Could not load. Is law-service running and are you signed in as an admin?</p>
        ) : toReview.length === 0 ? (
          <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">Nothing waiting. Press <span className="font-medium text-foreground">Fetch latest</span> to look for new items.</p>
        ) : (
          <div className="space-y-3">{toReview.map((i) => <ReviewCard key={i.id} item={i} busy={busyId === i.id} articles={targets.data ?? null} onPublish={(t, s) => publish(i, t, s)} onSkip={() => skip(i)} onWrite={(t, s, c) => writeArticle.mutate({ item: i, title: t, summary: s, categoryId: c })} />)}</div>
        )}
      </section>

      <section aria-labelledby="live-h">
        <h2 id="live-h" className="mb-3 text-base font-semibold">On the homepage now {live.data && <span className="text-muted-foreground">({onSite.length})</span>}</h2>
        {live.isLoading ? <Skeleton className="h-16 w-full" /> : onSite.length === 0 ? (
          <p className="rounded-lg border py-8 text-center text-sm text-muted-foreground">Nothing is live, so these strips are hidden on the site. Publish an item above to show it.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {onSite.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <Badge className="bg-green-100 text-green-700">Live</Badge>
                <span className="min-w-0 flex-1 font-medium">{i.title}<span className="block text-xs font-normal text-muted-foreground">{labelOf(i.widget)}{i.source_name ? ` · ${i.source_name}` : ''} · {expiresIn(i.expires_at)}</span></span>
                <Button asChild size="sm" variant="ghost"><Link href={`/law/home-widgets/${i.id}`}>Edit</Link></Button>
                <Button size="sm" variant="outline" disabled={busyId === i.id} onClick={() => takeDown(i)}>Take down</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="country-h">
        <h2 id="country-h" className="mb-1 text-base font-semibold">By country</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          {sources.data?.lastRunAt ? `Last fetch ${timeAgo(sources.data.lastRunAt)}.` : 'No fetch has run yet.'} Counts cover everything ever fetched from each source. Open a country to see each feed.
        </p>
        {sources.isLoading ? <Skeleton className="h-40 w-full" /> : sources.isError || !sources.data ? (
          <p className="rounded-lg border py-8 text-center text-sm text-red-600">Could not load the country breakdown.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            <div className="hidden grid-cols-[1.4fr_repeat(5,0.6fr)] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid">
              <span>Country</span><span>Sources</span><span>Waiting</span><span>Live</span><span>Skipped</span><span>Total</span>
            </div>
            {sources.data.countries.map((c) => <CountryRow key={c.region} c={c} active={country === c.region} onFilter={() => { setCountry(country === c.region ? '' : c.region); }} />)}
            <div className="px-4 py-3 text-sm text-muted-foreground">Added by hand (any country): <span className="font-medium text-foreground">{sources.data.manualEntries}</span></div>
          </div>
        )}
      </section>

      <details className="rounded-lg border">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">How this works, and where the content comes from</summary>
        <div className="space-y-3 border-t px-4 py-4 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li><span className="font-medium text-foreground">Fetch latest.</span> Pulls fresh court and justice-department news from official sources in the US, UK, Kenya, the UN and the ICC. Nothing goes live by itself.</li>
            <li><span className="font-medium text-foreground">Choose what to do with each item.</span> <em>Publish to homepage</em> shows a short strip. <em>Write full article</em> opens the CMS editor with the source attached, and you write the post in your own words, then publish it from there. <em>Skip</em> drops it. Fetched items only carry the source’s headline, name and link, never its text.</li>
            <li><span className="font-medium text-foreground">Done.</span> Breaking items hide themselves after 48 hours at most. Use “Take down” any time; every action has an Undo.</li>
          </ol>
          <p className="text-xs">Photos, audio, video, docket and ticker entries are added by hand with “Add your own”: photos need a credit or licence line, and only publish what you can point to a source for. An empty strip simply stays hidden.</p>
        </div>
      </details>

      <AllEntries countries={(sources.data?.countries ?? []).map((c) => c.region)} />
    </div>
  );
}

/** One country: totals on the row, each source's feed health and counts when opened. */
function CountryRow({ c, active, onFilter }: { c: CountryStat; active: boolean; onFilter: () => void }) {
  const broken = c.sources.filter((s) => s.lastRun && !s.lastRun.ok).length;
  return (
    <details className="group">
      <summary className="grid cursor-pointer select-none grid-cols-2 items-center gap-2 px-4 py-3 text-sm sm:grid-cols-[1.4fr_repeat(5,0.6fr)]">
        <span className="font-medium">{regionLabel(c.region)}{broken > 0 && <Badge className="ml-2 bg-amber-100 text-amber-700">{broken} feed {broken === 1 ? 'problem' : 'problems'}</Badge>}</span>
        <span className="text-muted-foreground">{c.sources.length} {c.sources.length === 1 ? 'source' : 'sources'}</span>
        <span>{c.waiting}<span className="text-muted-foreground sm:hidden"> waiting</span></span>
        <span>{c.live}<span className="text-muted-foreground sm:hidden"> live</span></span>
        <span className="text-muted-foreground">{c.skipped}<span className="sm:hidden"> skipped</span></span>
        <span className="text-muted-foreground">{c.total}<span className="sm:hidden"> total</span></span>
      </summary>
      <div className="space-y-2 bg-muted/30 px-4 py-3">
        {c.sources.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-card px-3 py-2 text-sm">
            <span className="min-w-0 flex-1"><span className="font-medium">{s.label}</span>
              <span className="block text-xs text-muted-foreground">Latest item {s.latestItemAt ? timeAgo(s.latestItemAt) : 'none yet'} · {s.waiting} waiting · {s.live} live · {s.skipped} skipped · {s.total} total</span>
            </span>
            {s.lastRun ? (s.lastRun.ok ? <Badge className="bg-green-100 text-green-700">Feed OK</Badge> : <Badge className="bg-red-100 text-red-700" title={s.lastRun.error ?? ''}>Feed failed</Badge>) : <Badge className="bg-gray-100 text-gray-600">Not checked yet</Badge>}
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline">Source feed <ExternalLink className="h-3 w-3" /></a>
          </div>
        ))}
        <Button size="sm" variant={active ? 'default' : 'outline'} onClick={onFilter}>{active ? `Showing only ${regionLabel(c.region)}: clear filter` : `Show only ${regionLabel(c.region)} in the lists above`}</Button>
      </div>
    </details>
  );
}

/** Search across every entry, including skipped, archived and expired ones. */
function AllEntries({ countries }: { countries: string[] }) {
  const [region, setRegion] = useState('');
  const [search, setSearch] = useState('');
  const [widget, setWidget] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search, 300);
  useEffect(() => { setPage(1); }, [q, widget, state, region]);
  const { data, isLoading } = useQuery({
    queryKey: ['law', 'home-widgets', 'all', { q, widget, state, region, page }],
    queryFn: () => homeWidgetsApi.list({
      page, limit: PAGE,
      ...(q ? { search: q } : {}), ...(widget ? { widget } : {}), ...(region ? { region } : {}),
      ...(state === 'published' ? { published: true, archived: false } : {}),
      ...(state === 'draft' ? { published: false, archived: false } : {}),
      ...(state === 'archived' ? { archived: true } : {}),
    }),
  });
  const rows = rowsOf<HomeWidgetRecord>(data);
  const total = (data as { data?: { pagination?: { total?: number } } })?.data?.pagination?.total ?? rows.length;
  return (
    <details className="rounded-lg border">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">All entries and history</summary>
      <div className="space-y-4 border-t p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search title or source…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" /></div>
          <select className={SELECT} value={widget} onChange={(e) => setWidget(e.target.value)} aria-label="Widget"><option value="">Any widget</option>{HOME_WIDGETS.map((w) => <option key={w.kind} value={w.kind}>{w.label}</option>)}</select>
          <select className={SELECT} value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Country"><option value="">Any country</option>{countries.map((c) => <option key={c} value={c}>{regionLabel(c)}</option>)}</select>
          <select className={SELECT} value={state} onChange={(e) => setState(e.target.value)} aria-label="State"><option value="">Any state</option><option value="published">Live</option><option value="draft">Waiting for review</option><option value="archived">Skipped or archived</option></select>
        </div>
        {isLoading ? <Skeleton className="h-24 w-full" /> : rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No entries match.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Entry</TableHead><TableHead>Widget</TableHead><TableHead>State</TableHead><TableHead className="text-right">Edit</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><div className="font-medium">{r.title}</div>{r.source_name && <div className="text-xs text-muted-foreground">{r.source_name}{regionLabel(r.region ?? r.extra?.region) ? ` · ${regionLabel(r.region ?? r.extra?.region)}` : ''}</div>}</TableCell>
                  <TableCell className="text-muted-foreground">{labelOf(r.widget)}</TableCell>
                  <TableCell>{r.archived ? <Badge className="bg-gray-100 text-gray-600">Skipped / archived</Badge> : isExpired(r) ? <Badge className="bg-gray-100 text-gray-600">Expired</Badge> : r.published ? <Badge className="bg-green-100 text-green-700">Live</Badge> : <Badge className="bg-amber-100 text-amber-700">Waiting</Badge>}</TableCell>
                  <TableCell className="text-right"><Button asChild variant="ghost" size="icon" aria-label={`Edit ${r.title}`}><Link href={`/law/home-widgets/${r.id}`}><Pencil className="h-4 w-4" /></Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {total > PAGE && <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{total} records</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page * PAGE >= total} onClick={() => setPage((p) => p + 1)}>Next</Button></div></div>}
      </div>
    </details>
  );
}
