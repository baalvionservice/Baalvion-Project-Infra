'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients } from '@/lib/api/client';
import type { NewsTrendingItem } from '@/lib/types/news.types';

const DIMENSIONS = [
  { value: 'category', label: 'By Category' },
  { value: 'country', label: 'By Country' },
  { value: 'source', label: 'By Source' },
] as const;

export default function NewsTrendingPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'News Intelligence', href: '/news-intelligence' }, { label: 'Trending' }]); }, [setBreadcrumbs]);

  const [dimension, setDimension] = useState<(typeof DIMENSIONS)[number]['value']>('category');

  const { data: items, isLoading } = useQuery({
    queryKey: ['news', 'admin-trending', dimension],
    queryFn: () =>
      serviceClients.news
        .get('/news/trending', { params: { dimension } })
        .then((r) => r.data.data.items as NewsTrendingItem[]),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trending"
        description="Real ingestion-volume ranking (current 24h window vs. prior 24h) — not entity/topic trending, that needs the AI-enrichment phase"
      />

      <Tabs value={dimension} onValueChange={(v) => setDimension(v as typeof dimension)}>
        <TabsList>{DIMENSIONS.map((d) => <TabsTrigger key={d.value} value={d.value}>{d.label}</TabsTrigger>)}</TabsList>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !items || items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No article volume yet.</p>
          ) : (
            <div className="space-y-1">
              {items.map((item, i) => (
                <div key={item.value} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <span className="flex items-center gap-3">
                    <span className="w-5 text-muted-foreground font-mono text-xs">{i + 1}</span>
                    <span className="font-medium">{item.value}</span>
                  </span>
                  <span className="font-mono">{item.count} articles</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
