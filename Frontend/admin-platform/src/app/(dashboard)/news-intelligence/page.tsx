'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, Radio, Gauge, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients } from '@/lib/api/client';
import type { NewsStatsOverview, NewsTrendingItem } from '@/lib/types/news.types';

export default function NewsIntelligenceOverviewPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'News Intelligence' }]); }, [setBreadcrumbs]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['news', 'stats-overview'],
    queryFn: () => serviceClients.news.get('/stats/overview').then((r) => r.data.data as NewsStatsOverview),
    refetchInterval: 60_000,
  });

  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['news', 'trending', 'category'],
    queryFn: () =>
      serviceClients.news
        .get('/news/trending', { params: { dimension: 'category' } })
        .then((r) => r.data.data.items as NewsTrendingItem[]),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="News Intelligence"
        description="Baalvion Intelligence ingestion pipeline — sources, articles, and trend volume (news-service)"
      />

      {stats && stats.totalArticles === 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-5 flex items-start gap-3 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-500" />
            <p>
              0 articles is expected in this environment — it has no outbound network access, so
              ingestion cannot reach real RSS feeds. Everything shown is live data from the real
              database; run <code className="font-mono">pnpm --filter news-service dev</code> on a
              machine with internet access and articles appear automatically.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <p className="text-2xl font-bold">{stats?.totalArticles.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats?.articlesLast24h} in the last 24h</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Sources</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <p className="text-2xl font-bold">{stats?.activeSources} / {stats?.totalSources}</p>
                <p className="text-xs text-muted-foreground mt-1">active / total registered</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Last Ingestion</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-32" /> : (
              <p className="text-lg font-semibold">
                {stats?.lastIngestedAt ? new Date(stats.lastIngestedAt).toLocaleString() : 'Never'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Volume by category (24h vs. prior 24h)</CardTitle></CardHeader>
        <CardContent>
          {trendingLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !trending || trending.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No article volume yet.</p>
          ) : (
            <div className="space-y-1">
              {trending.map((item, i) => (
                <div key={item.value} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <span className="flex items-center gap-3">
                    <span className="w-5 text-muted-foreground font-mono text-xs">{i + 1}</span>
                    <span className="font-medium">{item.value}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary">{item.count} articles</Badge>
                    {item.changePct !== null && (
                      <span className={item.changePct >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {item.changePct >= 0 ? '+' : ''}{item.changePct}%
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
