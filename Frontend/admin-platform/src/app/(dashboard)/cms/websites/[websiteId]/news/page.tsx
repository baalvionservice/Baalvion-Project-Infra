'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Radio, TrendingUp, Star, ArrowLeft, FileText } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ContentWorkflowBadge from '@/components/cms/ContentWorkflowBadge';
import QuickNewsDialog from '@/components/cms/QuickNewsDialog';
import { useContentList } from '@/lib/queries/cms-content.queries';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useWebsiteCategoryTree } from '@/lib/queries/cms-taxonomy.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { useCmsStore } from '@/lib/store/cmsStore';
import { formatDate } from '@/lib/utils/format';
import type { CategoryTree } from '@/lib/types/cms-taxonomy.types';

const dayKey = (iso: string) => iso.slice(0, 10);

function flattenNames(tree: CategoryTree[]): Map<string, string> {
  const m = new Map<string, string>();
  const walk = (nodes: CategoryTree[]) =>
    nodes.forEach((n) => {
      m.set(n.id, n.name);
      if (n.children?.length) walk(n.children);
    });
  walk(tree);
  return m;
}

export default function NewsDashboardPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = use(params);
  const router = useRouter();
  const { setBreadcrumbs } = useUIStore();
  const setActiveWebsiteId = useCmsStore((s) => s.setActiveWebsiteId);
  useEffect(() => { setActiveWebsiteId(websiteId); }, [websiteId, setActiveWebsiteId]);

  const [addOpen, setAddOpen] = useState(false);
  const { data: website } = useWebsite(websiteId);
  // News Desk is Imperialpedia-only for now — bounce any other site back to its
  // overview instead of rendering a dashboard scoped to a workflow it doesn't use yet.
  useEffect(() => {
    if (website && website.slug !== 'imperialpedia') router.replace(`/cms/websites/${websiteId}`);
  }, [website, websiteId, router]);
  const { data: tree } = useWebsiteCategoryTree(websiteId);
  // 100 most-recently-touched news items is enough for a "today / this week /
  // by niche" operational snapshot — this is a live pulse, not a full report.
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

  const items = useMemo(() => data?.data ?? [], [data]);
  const categoryName = useMemo(() => flattenNames(tree ?? []), [tree]);

  const today = dayKey(new Date().toISOString());
  const stats = useMemo(() => {
    const byDay = new Map<string, number>();
    const todayByNiche = new Map<string, number>();
    let publishedToday = 0;
    for (const item of items) {
      const created = dayKey(item.createdAt);
      byDay.set(created, (byDay.get(created) ?? 0) + 1);
      if (created === today) {
        const niche = categoryName.get(item.categoryIds[0]) ?? 'Uncategorized';
        todayByNiche.set(niche, (todayByNiche.get(niche) ?? 0) + 1);
        if (item.status === 'published') publishedToday += 1;
      }
    }
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d.toISOString());
      return { key, label: d.toLocaleDateString(undefined, { weekday: 'short' }), count: byDay.get(key) ?? 0 };
    }).reverse();
    const maxDay = Math.max(1, ...last7.map((d) => d.count));
    return {
      todayTotal: byDay.get(today) ?? 0,
      publishedToday,
      todayByNiche: Array.from(todayByNiche.entries()).sort((a, b) => b[1] - a[1]),
      last7,
      maxDay,
    };
  }, [items, categoryName, today]);

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
          description="Today's uploads, by niche — and the fast path to publish another one."
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/cms/websites/${websiteId}/content?type=news`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Full content manager
                </Link>
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add News
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

      {/* Today at a glance */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Uploaded Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : stats.todayTotal}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stats.publishedToday} published</p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Today by Niche</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : stats.todayByNiche.length ? (
              <div className="flex flex-wrap gap-2">
                {stats.todayByNiche.map(([niche, count]) => (
                  <Badge key={niche} variant="secondary" className="text-xs">
                    {niche} <span className="ml-1 font-bold">{count}</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nothing uploaded yet today.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last 7 days */}
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

      {/* Recent uploads */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Recent Uploads</h2>
        <div className="rounded-md border divide-y">
          {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 m-2" />)}
          {!isLoading && items.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No news yet. Click <span className="font-medium">Add News</span> to publish the first one.
            </p>
          )}
          {items.slice(0, 25).map((item) => (
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
                  {categoryName.get(item.categoryIds[0]) ?? 'Uncategorized'} · {formatDate(item.createdAt)}
                </p>
              </div>
              <ContentWorkflowBadge status={item.status} />
            </button>
          ))}
        </div>
      </div>

      <QuickNewsDialog
        websiteId={websiteId}
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => refetch()}
      />
    </div>
  );
}
