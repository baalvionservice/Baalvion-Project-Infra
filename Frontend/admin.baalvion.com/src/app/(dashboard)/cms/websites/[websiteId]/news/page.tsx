'use client';

import { use, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Search, RefreshCw, ListChecks, FileText, TrendingUp, TrendingDown,
  Upload as UploadIcon, PenSquare, Clock, AlertTriangle, Radio, Timer,
  Globe, Database, HeartPulse, ChevronRight, X, Rss, LineChart,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { LucideIcon } from 'lucide-react';
import { useContentList, useImportWireNews } from '@/lib/queries/cms-content.queries';
import { useWebsite, useWebsiteStats, useWebsiteMembers } from '@/lib/queries/cms-websites.queries';
import { useNewsTaxonomy } from '@/lib/hooks/useNewsTaxonomy';
import { NEWS_TOPICS, NEWS_REGIONS } from '@/lib/constants/news-taxonomy';
import { computeNewsroomStats } from '@/lib/newsroom/stats';
import KpiCard from '@/components/cms/newsroom/KpiCard';
import LiveFeed from '@/components/cms/newsroom/LiveFeed';
import UploadsTable from '@/components/cms/newsroom/UploadsTable';
import MarketDataPanel from '@/components/cms/newsroom/MarketDataPanel';
import SearchJumpDropdown from '@/components/cms/newsroom/SearchJumpDropdown';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/lib/store/uiStore';
import { useCmsStore } from '@/lib/store/cmsStore';
import type { ContentItem, ContentWorkflowStatus } from '@/lib/types/cms-content.types';

const REFRESH_MS = 12_000;
const BG = '#0F1115';
const CARD = '#181C22';
const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const ACCENT = '#2D7FF9';
const SUCCESS = '#16C784';
const WARNING = '#F59E0B';
const DANGER = '#EF4444';

const RANGES = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7d', label: 'Last 7 Days', days: 7 },
  { id: '30d', label: 'Last 30 Days', days: 30 },
  { id: 'all', label: 'All Time', days: Infinity },
] as const;
type RangeId = (typeof RANGES)[number]['id'];

function withinRange(item: ContentItem, days: number): boolean {
  if (!Number.isFinite(days)) return true;
  return Date.now() - Date.parse(item.createdAt) <= days * 86_400_000;
}

function Panel({ title, icon: Icon, children, className }: { title: string; icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border p-4', className)} style={{ background: CARD, borderColor: BORDER }}>
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" style={{ color: MUTED }} />}
        <h3 className="text-sm font-semibold" style={{ color: TEXT }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function NewsroomDashboardPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = use(params);
  const router = useRouter();
  const { setBreadcrumbs } = useUIStore();
  const setActiveWebsiteId = useCmsStore((s) => s.setActiveWebsiteId);
  useEffect(() => { setActiveWebsiteId(websiteId); }, [websiteId, setActiveWebsiteId]);

  const { data: website } = useWebsite(websiteId);
  useEffect(() => {
    if (website && website.slug !== 'imperialpedia') router.replace(`/cms/websites/${websiteId}`);
  }, [website, websiteId, router]);
  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'News' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  const { topicIdByName, regionIdBySlug, categories } = useNewsTaxonomy(websiteId);
  const { data: members } = useWebsiteMembers(website?.id ?? '');
  const { data: siteStats } = useWebsiteStats(website?.id ?? '');

  const [range, setRange] = useState<RangeId>('7d');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentWorkflowStatus | ''>('');
  const [topicFilter, setTopicFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [activity, setActivity] = useState<'hour' | 'day' | 'week'>('day');
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, refetch, dataUpdatedAt } = useContentList(
    { websiteId, page: 1, limit: 100, type: 'news' },
    { refetchInterval: REFRESH_MS },
  );
  const { mutate: importWire, isPending: isImporting } = useImportWireNews();

  // "Last updated Xs ago" ticker — independent of the fetch interval itself.
  useEffect(() => {
    const id = setInterval(() => setSecondsAgo(Math.round((Date.now() - dataUpdatedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [dataUpdatedAt]);

  const allItems = useMemo(() => data?.data ?? [], [data]);

  // Jump-to-article search — deliberately searches ALL items regardless of the
  // selected date range/status/topic filters below, since those exist for the
  // analytics widgets, not for "find this one article to edit."
  const searchMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return allItems
      .filter((i) => i.title.toLowerCase().includes(q))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [allItems, search]);
  const searchResults = searchMatches.slice(0, 8);

  useEffect(() => { setActiveSearchIndex(0); }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setIsSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // "/" jumps focus to search from anywhere on the page, unless already typing in a field.
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const goToArticleEditor = (item: ContentItem) => {
    setIsSearchOpen(false);
    router.push(`/cms/websites/${websiteId}/content/${item.id}`);
  };

  const handleSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSearchIndex((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSearchIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const target = searchResults[activeSearchIndex];
      if (target) { e.preventDefault(); goToArticleEditor(target); }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const topicLabelById = useMemo(() => {
    const m = new Map<string, string>();
    NEWS_TOPICS.forEach((t) => { const id = topicIdByName.get(t.toLowerCase()); if (id) m.set(id, t); });
    return m;
  }, [topicIdByName]);
  const regionLabelById = useMemo(() => {
    const m = new Map<string, string>();
    NEWS_REGIONS.forEach((r) => { const id = regionIdBySlug.get(r.slug); if (id) m.set(id, r.label); });
    return m;
  }, [regionIdBySlug]);
  const authorNameById = useMemo(() => {
    const m = new Map<number, string>();
    (members ?? []).forEach((mem) => m.set(mem.userId, mem.user.fullName));
    return m;
  }, [members]);

  const rangeDays = RANGES.find((r) => r.id === range)!.days;
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allItems.filter((i) => {
      if (!withinRange(i, rangeDays)) return false;
      if (statusFilter && i.status !== statusFilter) return false;
      if (topicFilter) {
        const topics = i.categoryIds.map((id) => topicLabelById.get(id));
        if (!topics.includes(topicFilter)) return false;
      }
      if (regionFilter) {
        const regions = i.categoryIds.map((id) => regionLabelById.get(id));
        if (!regions.includes(regionFilter)) return false;
      }
      if (q && !i.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allItems, rangeDays, statusFilter, topicFilter, regionFilter, search, topicLabelById, regionLabelById]);

  const stats = useMemo(
    () => computeNewsroomStats(filteredItems, topicLabelById, regionLabelById),
    [filteredItems, topicLabelById, regionLabelById],
  );

  const hasFilters = !!(statusFilter || topicFilter || regionFilter || search);
  const clearFilters = () => { setStatusFilter(''); setTopicFilter(''); setRegionFilter(''); setSearch(''); };

  const activityData = useMemo(() => {
    if (activity === 'hour') {
      const buckets = Array.from({ length: 24 }, (_, h) => ({ label: `${h}:00`, uploaded: 0, published: 0 }));
      allItems.filter((i) => withinRange(i, 1)).forEach((i) => {
        const h = new Date(i.createdAt).getHours();
        buckets[h].uploaded += 1;
        if (i.publishedAt && new Date(i.publishedAt).getHours() === h) buckets[h].published += 1;
      });
      return buckets;
    }
    if (activity === 'week') {
      const buckets = Array.from({ length: 8 }, (_, i) => {
        const start = Date.now() - (7 - i) * 7 * 86_400_000;
        return { label: `Wk ${i + 1}`, start, uploaded: 0, published: 0 };
      });
      allItems.forEach((i) => {
        const t = Date.parse(i.createdAt);
        const b = [...buckets].reverse().find((bk) => t >= bk.start);
        if (b) b.uploaded += 1;
      });
      return buckets.map(({ label, uploaded, published }) => ({ label, uploaded, published }));
    }
    return stats.trend7.map((d) => ({ label: d.date.slice(5), uploaded: d.uploaded, published: d.published }));
  }, [activity, allItems, stats.trend7]);

  const isLive = secondsAgo < REFRESH_MS / 1000 + 5;

  if (website && website.slug !== 'imperialpedia') return null;

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] p-6" style={{ background: BG }}>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold" style={{ color: TEXT }}>ImperialPedia Newsroom</h1>
          <span className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold" style={{ borderColor: SUCCESS, color: SUCCESS }}>
            <span className="relative flex h-1.5 w-1.5">
              {isLive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: SUCCESS }} />}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: SUCCESS }} />
            </span>
            LIVE
          </span>
          <span className="text-xs" style={{ color: MUTED }}>
            {isLoading ? 'Loading…' : `Updated ${secondsAgo}s ago`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div ref={searchWrapRef} className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: MUTED }} />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Jump to an article to edit… (press / )"
              className="h-8 w-72 rounded-md border pl-8 pr-2 text-xs outline-none focus:ring-1"
              style={{ background: BG, borderColor: BORDER, color: TEXT }}
            />
            {isSearchOpen && search.trim() && (
              <SearchJumpDropdown
                query={search.trim()}
                results={searchResults}
                totalMatches={searchMatches.length}
                topicLabelById={topicLabelById}
                regionLabelById={regionLabelById}
                activeIndex={activeSearchIndex}
                onSelect={goToArticleEditor}
              />
            )}
          </div>
          <div className="flex rounded-md border p-0.5" style={{ borderColor: BORDER }}>
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
                style={range === r.id ? { background: ACCENT, color: '#fff' } : { color: MUTED }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            className="flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors hover:bg-white/5"
            style={{ borderColor: BORDER, color: MUTED }}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={() => importWire(websiteId)}
            disabled={isImporting}
            className="flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ borderColor: BORDER, color: MUTED }}
            title="Pull real wire articles (BBC, TechCrunch, MarketWatch, etc.) in as draft news, tagged by topic + region"
          >
            <Rss className={cn('h-3.5 w-3.5', isImporting && 'animate-pulse')} />
            {isImporting ? 'Syncing…' : 'Sync Wire News'}
          </button>
          <Link
            href={`/cms/websites/${websiteId}/news/new`}
            className="flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: ACCENT }}
          >
            <Plus className="h-3.5 w-3.5" />
            Upload News
          </Link>
          <button
            onClick={() => setStatusFilter('pending_review')}
            className="flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors hover:bg-white/5"
            style={{ borderColor: BORDER, color: MUTED }}
          >
            <ListChecks className="h-3.5 w-3.5" />
            Review Queue
          </button>
        </div>
      </div>

      {isError && (
        <div className="mb-4 rounded-md border px-4 py-2 text-sm" style={{ borderColor: DANGER, color: DANGER, background: `${DANGER}0D` }}>
          Couldn&apos;t load news. <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {hasFilters && (
        <div className="mb-4 flex items-center gap-2 text-xs" style={{ color: MUTED }}>
          Filtered {topicFilter && `· Topic: ${topicFilter}`} {regionFilter && `· Region: ${regionFilter}`} {statusFilter && `· Status: ${statusFilter}`} {search && `· "${search}"`}
          <button onClick={clearFilters} className="flex items-center gap-0.5 underline">
            <X className="h-3 w-3" /> clear
          </button>
        </div>
      )}

      {/* KPI grid */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard stat={stats.kpis.published} icon={FileText} />
        <KpiCard stat={stats.kpis.uploaded} icon={UploadIcon} />
        <KpiCard stat={stats.kpis.drafts} icon={PenSquare} />
        <KpiCard stat={stats.kpis.scheduled} icon={Clock} />
        <KpiCard stat={stats.kpis.breaking} icon={Radio} />
        <KpiCard stat={stats.kpis.pendingReview} icon={ListChecks} />
        <KpiCard stat={stats.kpis.staleDrafts} icon={AlertTriangle} />
        <KpiCard
          stat={{ label: 'Avg. Publish Time', value: stats.kpis.avgPublishMinutes ?? 0, trendPct: null, sparkline: [], color: ACCENT }}
          icon={Timer}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Publishing activity */}
        <Panel title="Publishing Activity" icon={TrendingUp} className="lg:col-span-2">
          <div className="mb-3 flex gap-1">
            {(['hour', 'day', 'week'] as const).map((a) => (
              <button
                key={a}
                onClick={() => setActivity(a)}
                className="rounded px-2 py-0.5 text-[11px] font-medium capitalize transition-colors"
                style={activity === a ? { background: `${ACCENT}26`, color: ACCENT } : { color: MUTED }}
              >
                {a}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} interval={activity === 'hour' ? 2 : 0} />
              <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
              <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 12 }} labelStyle={{ color: TEXT }} />
              <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} />
              <Bar dataKey="uploaded" name="Uploaded" fill={ACCENT} radius={[3, 3, 0, 0]} isAnimationActive />
              <Bar dataKey="published" name="Published" fill={SUCCESS} radius={[3, 3, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Editorial pipeline */}
        <Panel title="Editorial Pipeline" icon={ChevronRight}>
          <div className="space-y-2">
            {stats.pipeline.map((stage, i) => (
              <button
                key={stage.key}
                onClick={() => setStatusFilter(stage.statuses[0])}
                className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors hover:bg-white/5"
                style={{ borderColor: BORDER }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono" style={{ color: MUTED }}>{i + 1}</span>
                  <span className="h-2 w-2 rounded-full" style={{ background: stage.color }} />
                  <span className="text-xs font-medium" style={{ color: TEXT }}>{stage.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums" style={{ color: TEXT }}>{stage.count}</p>
                  {stage.avgWaitHours !== null && (
                    <p className="text-[10px]" style={{ color: MUTED }}>{stage.avgWaitHours}h avg</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Coverage Health — By Topic">
          <div className="space-y-1.5">
            {stats.byTopic.map(([topic, count]) => (
              <button
                key={topic}
                onClick={() => setTopicFilter(topicFilter === topic ? '' : topic)}
                className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-white/5"
              >
                <span className="w-32 shrink-0 truncate text-xs" style={{ color: count === 0 ? DANGER : TEXT }}>{topic}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: BORDER }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${stats.byTopic[0][1] ? (count / stats.byTopic[0][1]) * 100 : 0}%`,
                      background: count === 0 ? DANGER : ACCENT,
                    }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color: count === 0 ? DANGER : TEXT }}>{count}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Regional Coverage">
          <div className="space-y-1.5">
            {stats.byRegion.map(([region, count]) => (
              <button
                key={region}
                onClick={() => setRegionFilter(regionFilter === region ? '' : region)}
                className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-white/5"
              >
                <span className="w-32 shrink-0 truncate text-xs" style={{ color: count === 0 ? DANGER : TEXT }}>{region}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: BORDER }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${stats.byRegion[0][1] ? (count / stats.byRegion[0][1]) * 100 : 0}%`,
                      background: count === 0 ? DANGER : SUCCESS,
                    }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color: count === 0 ? DANGER : TEXT }}>{count}</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Live Market Data" icon={LineChart} className="mb-5">
        <MarketDataPanel websiteId={websiteId} />
      </Panel>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Live News Feed" icon={Radio}>
          <LiveFeed items={allItems} topicLabelById={topicLabelById} regionLabelById={regionLabelById} onSelect={(id) => router.push(`/cms/websites/${websiteId}/content/${id}`)} />
        </Panel>

        <Panel title="Breaking News Monitor" icon={AlertTriangle}>
          {stats.breakingItems.length === 0 ? (
            <p className="py-8 text-center text-xs" style={{ color: MUTED }}>No breaking news detected.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {stats.sourceBreakdown.map(([source, count]) => (
                  <span key={source} className="rounded-full border px-2 py-0.5 text-[11px]" style={{ borderColor: DANGER, color: DANGER }}>
                    {source} <span className="font-bold">{count}</span>
                  </span>
                ))}
              </div>
              <div className="space-y-1.5">
                {stats.breakingItems.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push(`/cms/websites/${websiteId}/content/${item.id}`)}
                    className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left hover:bg-white/5"
                    style={{ borderColor: BORDER }}
                  >
                    <span className="truncate text-xs" style={{ color: TEXT }}>{item.title}</span>
                    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" style={{ color: item.status === 'published' ? SUCCESS : WARNING, background: item.status === 'published' ? `${SUCCESS}1A` : `${WARNING}1A` }}>
                      {item.status === 'published' ? 'Published' : 'Awaiting Review'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Recent uploads table */}
      <Panel title={`Recent Uploads — ${RANGES.find((r) => r.id === range)!.label}`} icon={FileText} className="mb-5">
        <UploadsTable
          items={filteredItems.slice(0, 50)}
          topicLabelById={topicLabelById}
          regionLabelById={regionLabelById}
          authorNameById={authorNameById}
          categories={categories}
          websiteId={websiteId}
          websiteDomain={website?.domain}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 7-day trend */}
        <Panel title="7-Day Trend" icon={TrendingDown} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.trend7}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
              <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 12 }} labelStyle={{ color: TEXT }} />
              <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} />
              <Bar dataKey="uploaded" name="Uploaded" stackId="a" fill={ACCENT} />
              <Bar dataKey="published" name="Published" stackId="a" fill={SUCCESS} />
              <Bar dataKey="draft" name="Draft" stackId="a" fill={WARNING} />
              <Bar dataKey="scheduled" name="Scheduled" stackId="a" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* System health — real signals only; no fabricated queue/worker/AI status */}
        <Panel title="System Health" icon={HeartPulse}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2" style={{ color: MUTED }}><Globe className="h-3.5 w-3.5" /> Site Status</span>
              <span className="flex items-center gap-1.5 font-medium" style={{ color: website?.status === 'active' ? SUCCESS : WARNING }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: website?.status === 'active' ? SUCCESS : WARNING }} />
                {website?.status === 'active' ? 'Operational' : (website?.status ?? '—')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2" style={{ color: MUTED }}><Database className="h-3.5 w-3.5" /> Database</span>
              <span className="flex items-center gap-1.5 font-medium" style={{ color: isError ? DANGER : SUCCESS }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: isError ? DANGER : SUCCESS }} />
                {isError ? 'Degraded' : 'Connected'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: MUTED }}>Media Storage</span>
              <span className="font-medium" style={{ color: TEXT }}>
                {siteStats?.mediaStorageUsedMb ? `${Math.round(siteStats.mediaStorageUsedMb)} MB` : '—'}
              </span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
