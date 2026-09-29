'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceClients, normalizeError } from '@/lib/api/client';
import type { AxiosError } from 'axios';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Send, Archive, Search, Lock } from 'lucide-react';

interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  category?: string | null;
  status: 'draft' | 'published' | 'archived';
  is_premium: boolean;
  views_count: number;
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-gray-100 text-gray-600',
  archived: 'bg-red-100 text-red-700',
};

export default function ArticlesListPage() {
  const { setBreadcrumbs } = useUIStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Imperialpedia', href: '/imperialpedia' }, { label: 'Articles' }]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['imperialpedia', 'articles', 'list', { status }],
    queryFn: () =>
      serviceClients.imperialpedia
        .get('/articles', { params: { limit: 100, status } })
        .then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'articles'] });

  const publish = useMutation({
    mutationFn: (id: number) => serviceClients.imperialpedia.post(`/articles/${id}/publish`),
    onSuccess: () => { setActionError(null); invalidate(); },
    onError: (err) => setActionError(normalizeError(err as AxiosError).message),
  });

  const archive = useMutation({
    mutationFn: (id: number) => serviceClients.imperialpedia.delete(`/articles/${id}`),
    onSuccess: () => { setActionError(null); invalidate(); },
    onError: (err) => setActionError(normalizeError(err as AxiosError).message),
  });

  const allItems = (data?.data?.items ?? []) as ArticleRow[];
  const items = search
    ? allItems.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()))
    : allItems;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Articles"
        description="Community-authored articles & their premium/paywall status (imperialpedia-service)"
        actions={
          <Button asChild>
            <Link href="/imperialpedia/articles/new"><Plus className="mr-2 h-4 w-4" /> New article</Link>
          </Button>
        }
      />

      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search articles…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No articles found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.title}</div>
                      <div className="font-mono text-xs text-muted-foreground">/{row.slug}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.category || '—'}</TableCell>
                    <TableCell><Badge className={STATUS_STYLES[row.status]}>{row.status}</Badge></TableCell>
                    <TableCell>
                      {row.is_premium ? (
                        <Badge className="gap-1 bg-amber-100 text-amber-700"><Lock className="h-3 w-3" /> Premium</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.views_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {row.status === 'draft' && (
                          <Button variant="ghost" size="icon" onClick={() => publish.mutate(row.id)} disabled={publish.isPending} title="Publish">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button asChild variant="ghost" size="icon" title="Edit">
                          <Link href={`/imperialpedia/articles/${row.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        {row.status !== 'archived' && (
                          <Button
                            variant="ghost" size="icon" title="Archive"
                            onClick={() => window.confirm(`Archive "${row.title}"?`) && archive.mutate(row.id)}
                            disabled={archive.isPending}
                          >
                            <Archive className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
