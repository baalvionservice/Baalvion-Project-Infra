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
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface TermRow {
  id: string;
  term: string;
  slug: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string | null;
  status: 'draft' | 'review' | 'published' | 'archived';
  view_count?: number;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-amber-100 text-amber-700',
  expert: 'bg-purple-100 text-purple-700',
};
const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  review: 'bg-amber-100 text-amber-700',
  draft: 'bg-gray-100 text-gray-600',
  archived: 'bg-red-100 text-red-700',
};

export default function GlossaryListPage() {
  const { setBreadcrumbs } = useUIStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [status, setStatus] = useState('all');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Imperialpedia', href: '/imperialpedia' }, { label: 'Glossary' }]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['imperialpedia', 'glossary', 'list', { search, difficulty, status }],
    queryFn: () =>
      serviceClients.imperialpedia
        .get('/glossary', {
          params: {
            limit: 200,
            ...(search ? { search } : {}),
            ...(difficulty !== 'all' ? { difficulty } : {}),
            ...(status !== 'all' ? { status } : {}),
          },
        })
        .then((r) => r.data),
  });

  const remove = useMutation({
    mutationFn: (id: string) => serviceClients.imperialpedia.delete(`/glossary/${id}`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'glossary'] });
    },
    onError: (err) => setActionError(normalizeError(err as AxiosError).message),
  });

  const handleDelete = (row: TermRow) => {
    if (window.confirm(`Delete the term "${row.term}"? This cannot be undone.`)) remove.mutate(row.id);
  };

  const items = (data?.data?.items ?? []) as TermRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Glossary"
        description="Investopedia-style financial terms (imperialpedia-service)"
        actions={
          <Button asChild>
            <Link href="/imperialpedia/glossary/new"><Plus className="mr-2 h-4 w-4" /> New term</Link>
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
            <Input className="pl-9" placeholder="Search terms…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Difficulty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All difficulties</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="review">Review</SelectItem>
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
            <p className="py-16 text-center text-sm text-muted-foreground">No terms found. Create your first term.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.term}</div>
                      <div className="font-mono text-xs text-muted-foreground">/{row.slug}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.category || '—'}</TableCell>
                    <TableCell><Badge className={DIFFICULTY_STYLES[row.difficulty]}>{row.difficulty}</Badge></TableCell>
                    <TableCell><Badge className={STATUS_STYLES[row.status]}>{row.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/imperialpedia/glossary/${row.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(row)} disabled={remove.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
