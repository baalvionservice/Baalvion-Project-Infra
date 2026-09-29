'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceClients, normalizeError } from '@/lib/api/client';
import type { AxiosError } from 'axios';
import PageHeader from '@/components/common/PageHeader';
import { PromptContentRulesNotice } from '@/components/imperialpedia/PromptContentRulesNotice';
import { useUIStore } from '@/lib/store/uiStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Archive, Search, Flame } from 'lucide-react';

interface PromptRow {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
  status: 'active' | 'archived';
  is_trending: boolean;
  trending_order?: number | null;
  views_count: number;
  copies_count: number;
  hero_image?: string | null;
  items: { heading: string; images: { url: string }[] }[];
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-red-100 text-red-700',
};

export default function PromptsListPage() {
  const { setBreadcrumbs } = useUIStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Imperialpedia', href: '/imperialpedia' }, { label: 'Prompts' }]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['imperialpedia', 'prompts', 'list'],
    queryFn: () => serviceClients.imperialpedia.get('/prompts', { params: { status: 'all', limit: 100 } }).then((r) => r.data),
  });

  const archive = useMutation({
    mutationFn: (id: string) => serviceClients.imperialpedia.delete(`/prompts/${id}`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'prompts'] });
    },
    onError: (err) => setActionError(normalizeError(err as AxiosError).message),
  });

  const allItems = (data?.data?.items ?? []) as PromptRow[];
  const items = search
    ? allItems.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || (p.category ?? '').toLowerCase().includes(search.toLowerCase()))
    : allItems;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompts"
        description="AI image-prompt gallery — powers /prompts and /trending-prompts (imperialpedia-service)"
        actions={
          <Button asChild>
            <Link href="/imperialpedia/prompts/new"><Plus className="mr-2 h-4 w-4" /> New prompt</Link>
          </Button>
        }
      />

      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}

      <PromptContentRulesNotice />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search title or category…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No prompts found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Prompts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trending</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Copies</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {(row.hero_image || row.items?.[0]?.images?.[0]?.url) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.hero_image || row.items[0].images[0].url} alt="" className="h-10 w-10 rounded object-cover" />
                        )}
                        <div>
                          <div className="font-medium">{row.title}</div>
                          <div className="font-mono text-xs text-muted-foreground">/prompts/{row.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.category || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{row.items?.length ?? 0}</TableCell>
                    <TableCell><Badge className={STATUS_STYLES[row.status]}>{row.status}</Badge></TableCell>
                    <TableCell>
                      {row.is_trending ? (
                        <Badge className="bg-orange-100 text-orange-700"><Flame className="mr-1 h-3 w-3" /> #{row.trending_order ?? '—'}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.views_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.copies_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="Edit">
                          <Link href={`/imperialpedia/prompts/${row.id}/edit`}><Pencil className="h-4 w-4" /></Link>
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
