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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface EntityRow {
  id: string;
  type: string;
  name: string;
  slug: string;
  category?: string | null;
  country?: string | null;
  industry?: string | null;
}

export default function EntitiesListPage() {
  const { setBreadcrumbs } = useUIStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Imperialpedia', href: '/imperialpedia' }, { label: 'Entities' }]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['imperialpedia', 'entities', 'list', { search, type }],
    queryFn: () =>
      serviceClients.imperialpedia
        .get('/entities', {
          params: {
            limit: 200,
            ...(search ? { search } : {}),
            ...(type.trim() ? { type: type.trim() } : {}),
          },
        })
        .then((r) => r.data),
  });

  const remove = useMutation({
    mutationFn: (row: EntityRow) => serviceClients.imperialpedia.delete(`/entities/${row.type}/${row.slug}`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'entities'] });
    },
    onError: (err) => setActionError(normalizeError(err as AxiosError).message),
  });

  const handleDelete = (row: EntityRow) => {
    if (window.confirm(`Delete the entity "${row.name}"? This cannot be undone.`)) remove.mutate(row);
  };

  const items = (data?.data?.items ?? []) as EntityRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entities"
        description="Structured knowledge-graph entities (imperialpedia-service)"
        actions={
          <Button asChild>
            <Link href="/imperialpedia/entities/new"><Plus className="mr-2 h-4 w-4" /> New entity</Link>
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
            <Input className="pl-9" placeholder="Search entities…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Input className="w-full md:w-48" placeholder="Filter by type…" value={type} onChange={(e) => setType(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No entities found. Create your first entity.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Country / Industry</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">/{row.slug}</div>
                    </TableCell>
                    <TableCell><Badge className="bg-blue-100 text-blue-700">{row.type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">
                      {[row.country, row.industry].filter(Boolean).join(' · ') || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.category || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/imperialpedia/entities/${encodeURIComponent(row.type)}/${encodeURIComponent(row.slug)}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
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
