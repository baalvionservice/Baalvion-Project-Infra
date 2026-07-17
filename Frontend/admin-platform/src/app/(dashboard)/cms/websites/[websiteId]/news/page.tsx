'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Radio, TrendingUp, Star, ArrowLeft, FileText } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import ContentWorkflowBadge from '@/components/cms/ContentWorkflowBadge';
import { useContentList } from '@/lib/queries/cms-content.queries';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useNewsTaxonomy } from '@/lib/hooks/useNewsTaxonomy';
import { NEWS_TOPICS, NEWS_REGIONS } from '@/lib/constants/news-taxonomy';
import { useUIStore } from '@/lib/store/uiStore';
import { useCmsStore } from '@/lib/store/cmsStore';
import { formatDate } from '@/lib/utils/format';
import type { ContentItem } from '@/lib/types/cms-content.types';

const dayKey = (iso: string) => iso.slice(0, 10);

const RANGES = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7d', label: '7 Days', days: 7 },
  { id: '30d', label: '30 Days', days: 30 },
  { id: 'all', label: 'All Time', days: Infinity },
] as const;
type RangeId = (typeof RANGES)[number]['id'];

function withinRange(item: ContentItem, days: number): boolean {
  if (!Number.isFinite(days)) return true;
  const cutoff = Date.now() - days * 86_400_000;
  return Date.parse(item.createdAt) >= cutoff;
}

export default function NewsDashboardPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = use(params);
  const router = useRouter();
  const { setBreadcrumbs } = useUIStore();
  const setActiveWebsiteId = useCmsStore((s) => s.setActiveWebsiteId);
  useEffect(() => { setActiveWebsiteId(websiteId); }, [websiteId, setActiveWebsiteId]);

  const { data: website } = useWebsite(websiteId);
  // News Desk is Imperialpedia-only for now — bounce any other site back to its
  // overview instead of rendering a dashboard scoped to a workflow it doesn't use yet.
  useEffect(() => {
    if (website && website.slug !== 'imperialpedia') router.replace(`/cms/websites/${websiteId}`);
  }, [website, websiteId, router]);

  const { topicIdByName, regionIdBySlug } = useNewsTaxonomy(websiteId);
  const [range, setRange] = useState<RangeId>('7d');
  // cms-service caps list requests at 100 — plenty at current news volume; if this
  // site is ever publishing 100+ news items within 30 days, paginate here instead.
  const { data, isLoading, isError, refetch } = useContentList({
    websiteId, page: 1, limit: 100, type: 'news',
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'News' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  const allItems = useMemo(() => data?.data ?? [], [data]);

  // id → label lookups for exactly the 13 fixed topics and 6 fixed regions —
  // anything else assigned to an item (a leftover CMS category) is ignored here,
  // this table tracks the taxonomy the newsroom actually uses.
  const topicLabelById = useMemo(() => {
    const m = new Map<string, string>();
    NEWS_TOPICS.forEach((t) => {
      const id = topicIdByName.get(t.toLowerCase());
      if (id) m.set(id, t);
    });
    return m;
  }, [topicIdByName]);

  const regionLabelById = useMemo(() => {
    const m = new Map<string, string>();
    NEWS_REGIONS.forEach((r) => {
      const id = regionIdBySlug.get(r.slug);
      if (id) m.set(id, r.label);
    });
    return m;
  }, [regionIdBySlug]);

  const itemTopics = (item: ContentItem) => item.categoryIds.map((id) => topicLabelById.get(id)).filter((v): v is string => !!v);
  const itemRegion = (item: ContentItem) => item.categoryIds.map((id) => regionLabelById.get(id)).find((v): v is string => !!v);

  const rangeDays = RANGES.find((r) => r.id === range)!.days;
  const items = useMemo(() => allItems.filter((i) => withinRange(i, rangeDays)), [allItems, rangeDays]);

  const stats = useMemo(() => {
    const byTopic = new Map<string, number>(NEWS_TOPICS.map((t) => [t, 0]));
    const byRegion = new Map<string, number>(NEWS_REGIONS.map((r) => [r.label, 0]));
    let published = 0;
    for (const item of items) {
      itemTopics(item).forEach((t) => byTopic.set(t, (byTopic.get(t) ?? 0) + 1));
      const region = itemRegion(item);
      if (region) byRegion.set(region, (byRegion.get(region) ?? 0) + 1);
      if (item.status === 'published') published += 1;
    }

    const byDay = new Map<string, number>();
    for (const item of allItems) {
      const created = dayKey(item.createdAt);
      byDay.set(created, (byDay.get(created) ?? 0) + 1);
    }
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d.toISOString());
      return { key, label: d.toLocaleDateString(undefined, { weekday: 'short' }), count: byDay.get(key) ?? 0 };
    }).reverse();
    const maxDay = Math.max(1, ...last7.map((d) => d.count));

    return {
      total: items.length,
      published,
      draft: items.length - published,
      byTopic: Array.from(byTopic.entries()).sort((a, b) => b[1] - a[1]),
      byRegion: Array.from(byRegion.entries()).sort((a, b) => b[1] - a[1]),
      last7,
      maxDay,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itemTopics/itemRegion close over topicLabelById/regionLabelById, already deps
  }, [items, allItems, topicLabelById, regionLabelById]);

  if (website && website.slug !== 'imperialpedia') return null;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href={`/cms/websites/${websiteId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {website?.name ?? 'Website'}
          </Link>
        </Button>
        <PageHeader
          title="News"
          description="Track how many stories go out, and in which topic and region."
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/cms/websites/${websiteId}/content?type=news`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Full content manager
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/cms/websites/${websiteId}/news/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add News
                </Link>
              </Button>
            </div>
          }
        />
      </div>

      {isError && (
        <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          <span>Couldn&apos;t load news.</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {/* Range selector */}
      <div className="flex gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              range === r.id ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/60',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* At a glance */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Uploaded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{isLoading ? <Skeleton className="h-8 w-12" /> : stats.published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">{isLoading ? <Skeleton className="h-8 w-12" /> : stats.draft}</p>
          </CardContent>
        </Card>
      </div>

      {/* By topic / by region — the full fixed taxonomy, zeros included */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">By Topic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              stats.byTopic.map(([topic, count]) => (
                <div key={topic} className="flex items-center gap-2 text-sm">
                  <span className="w-32 shrink-0 truncate">{topic}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${stats.byTopic[0][1] ? (count / stats.byTopic[0][1]) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right font-semibold">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">By Region</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              stats.byRegion.map(([region, count]) => (
                <div key={region} className="flex items-center gap-2 text-sm">
                  <span className="w-32 shrink-0 truncate">{region}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${stats.byRegion[0][1] ? (count / stats.byRegion[0][1]) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right font-semibold">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last 7 days — always shown regardless of the range filter above, as a trend view */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-24">
            {stats.last7.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-16 w-full items-end">
                  <div
                    className="w-full rounded-t bg-primary/70"
                    style={{ height: `${Math.max(4, (d.count / stats.maxDay) * 100)}%` }}
                    title={`${d.count} uploaded`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.label}</span>
                <span className="text-[10px] font-semibold">{d.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Uploads in the selected range */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Uploads — {RANGES.find((r) => r.id === range)!.label}</h2>
        <div className="rounded-md border divide-y">
          {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 m-2" />)}
          {!isLoading && items.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nothing in this range. Click <span className="font-medium">Add News</span> to publish one.
            </p>
          )}
          {items.slice(0, 50).map((item) => {
            const topics = itemTopics(item);
            const region = itemRegion(item);
            return (
              <button
                key={item.id}
                onClick={() => router.push(`/cms/websites/${websiteId}/content/${item.id}`)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    {item.isBreaking && <Radio className="h-3 w-3 shrink-0 text-red-500" />}
                    {item.isTrending && <TrendingUp className="h-3 w-3 shrink-0 text-orange-500" />}
                    {item.isFeatured && <Star className="h-3 w-3 shrink-0 text-amber-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[topics.join(', ') || 'No topic', region].filter(Boolean).join(' · ')} · {formatDate(item.createdAt)}
                  </p>
                </div>
                <ContentWorkflowBadge status={item.status} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
