'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients } from '@/lib/api/client';
import type { NewsCategory, PaginatedNewsArticles } from '@/lib/types/news.types';

const ALL = 'all';
const CATEGORIES: NewsCategory[] = ['AI', 'Technology', 'Business', 'Finance', 'Startups', 'Cybersecurity', 'World', 'Science'];

export default function NewsArticlesPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'News Intelligence', href: '/news-intelligence' }, { label: 'Articles' }]); }, [setBreadcrumbs]);

  const qc = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState(ALL);

  const { data, isLoading } = useQuery({
    queryKey: ['news', 'admin-articles', keyword, category],
    queryFn: () =>
      serviceClients.news
        .get('/articles', {
          params: {
            ...(keyword ? { keyword } : {}),
            ...(category !== ALL ? { category } : {}),
            limit: 30,
          },
        })
        .then((r) => r.data.data as PaginatedNewsArticles),
  });

  const removeArticle = useMutation({
    mutationFn: (id: string) => serviceClients.news.delete(`/articles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['news', 'admin-articles'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Articles" description="Every ingested article across all sources — search, filter, moderate" />

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search title…" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="max-w-xs" />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{data ? `${data.total} articles` : ''}</span>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !data || data.items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No articles yet — the ingestion pipeline hasn&apos;t pulled any real articles into this
              environment (no outbound network here).
            </p>
          ) : (
            <div className="divide-y">
              {data.items.map((article) => (
                <div key={article.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{article.category}</Badge>
                      {article.sentiment && <Badge variant="secondary">{article.sentiment}</Badge>}
                    </div>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                      {article.title}
                    </a>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {article.source.name} · {new Date(article.published_at).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeArticle.mutate(article.id)} className="shrink-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
