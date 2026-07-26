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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { SITE_CONTENT_TYPES } from '@/components/imperialpedia/SiteContentForm';

interface SiteContentRow {
  id: string;
  type: string;
  name: string;
  slug: string;
}

export default function SiteContentListPage() {
  const { setBreadcrumbs } = useUIStore();
  const queryClient = useQueryClient();
  const [type, setType] = useState<string>('all');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Imperialpedia', href: '/imperialpedia' }, { label: 'Site Content' }]);
  }, [setBreadcrumbs]);

  // One query per content type (rather than one query with no type filter) since
  // the underlying /entities list endpoint is a shared knowledge-graph table —
  // scoping to these 5 types keeps this screen from ever showing companies/terms/etc.
  const { data, isLoading } = useQuery({
    queryKey: ['imperialpedia', 'site-content', 'list', type],
    queryFn: async () => {
      const types = type === 'all' ? SITE_CONTENT_TYPES : [type];
      const results = await Promise.all(
        types.map((t) => serviceClients.imperialpedia.get('/entities', { params: { type: t, limit: 200 } })),
      );
      return results.flatMap((r) => r.data?.data?.items ?? []) as SiteContentRow[];
    },
  });

  const remove = useMutation({
    mutationFn: (row: SiteContentRow) => serviceClients.imperialpedia.delete(`/entities/${row.type}/${row.slug}`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'site-content'] });
    },
    onError: (err) => setActionError(normalizeError(err as AxiosError).message),
  });

  const handleDelete = (row: SiteContentRow) => {
    if (window.confirm(`Delete "${row.name}"? The public page will fall back to its bundled default content.`)) {
      remove.mutate(row);
    }
  };

  const items = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Content"
        description="Editable content for calculator explainers, stock lists, market indexes, and topic intros — falls back to bundled defaults when a record doesn't exist yet."
        actions={
          <Button asChild>
            <Link href="/imperialpedia/site-content/new"><Plus className="mr-2 h-4 w-4" /> New content</Link>
          </Button>
        }
      />

      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}

      <Card>
        <CardContent className="p-4">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full md:w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All content types</SelectItem>
              {SITE_CONTENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No content records yet — public pages are showing their bundled default content. Create one to override it.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/imperialpedia/site-content/${encodeURIComponent(row.type)}/${encodeURIComponent(row.slug)}/edit`}>
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
