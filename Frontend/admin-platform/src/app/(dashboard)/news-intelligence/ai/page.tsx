'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients } from '@/lib/api/client';
import { formatNumber } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface AiOverview {
  enrichedArticles: number;
  pendingEnrichment: number;
  sentimentDistribution: Array<{ sentiment: 'positive' | 'neutral' | 'negative'; count: number }>;
  topEntities: Array<{ name: string; count: number }>;
  method: string;
}

const SENTIMENT_COLOR: Record<string, string> = {
  positive: 'bg-green-500',
  neutral: 'bg-muted-foreground/50',
  negative: 'bg-red-500',
};

export default function NewsAiPage() {
  const { setBreadcrumbs } = useUIStore();
  const qc = useQueryClient();
  useEffect(() => { setBreadcrumbs([{ label: 'News Intelligence', href: '/news-intelligence' }, { label: 'AI' }]); }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['news', 'admin-ai-overview'],
    queryFn: () => serviceClients.news.get('/ai/overview').then((r) => r.data.data as AiOverview),
  });

  const enrich = useMutation({
    mutationFn: () => serviceClients.news.post('/ai/enrich', { limit: 200 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['news', 'admin-ai-overview'] }),
  });

  const totalSentiment = (data?.sentimentDistribution ?? []).reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Intelligence"
        description="Real sentiment + entity extraction over ingested articles (lexicon-based, in-process — no external LLM is configured for this service yet)"
        actions={
          <Button size="sm" onClick={() => enrich.mutate()} disabled={enrich.isPending}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', enrich.isPending && 'animate-spin')} />
            Run Enrichment
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Enriched</p>
            <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-14" /> : formatNumber(data?.enrichedArticles ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Pending</p>
            <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-14" /> : formatNumber(data?.pendingEnrichment ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Method</p>
            <Badge variant="outline" className="font-mono text-xs">{data?.method ?? 'lexicon-scorer'}</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Sentiment Distribution
            </CardTitle>
            <CardDescription>Real per-article polarity score over title + summary text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : totalSentiment === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No enriched articles yet — run enrichment above</p>
            ) : (
              (data?.sentimentDistribution ?? []).map((d) => (
                <div key={d.sentiment} className="flex items-center gap-3">
                  <span className="text-xs w-16 shrink-0 capitalize">{d.sentiment}</span>
                  <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                    <div className={cn('h-full rounded', SENTIMENT_COLOR[d.sentiment])} style={{ width: `${(d.count / totalSentiment) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{d.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Entities</CardTitle>
            <CardDescription>Proper-noun phrases extracted from article text, ranked by frequency</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : !data?.topEntities?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No entities extracted yet</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.topEntities.map((e) => (
                  <Badge key={e.name} variant="outline" className="text-xs">
                    {e.name} <span className="ml-1 text-muted-foreground">{e.count}</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
