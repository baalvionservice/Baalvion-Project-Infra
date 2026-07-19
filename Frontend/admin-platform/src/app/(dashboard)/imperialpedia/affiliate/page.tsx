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
import { Plus, Pencil, Archive, Search, BarChart3 } from 'lucide-react';

interface AffiliateProductRow {
  id: string;
  slug: string;
  product_name: string;
  merchant_name: string;
  category?: string | null;
  status: 'active' | 'paused' | 'archived';
  clicks_count: number;
  commission_rate?: number | null;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  archived: 'bg-red-100 text-red-700',
};

export default function AffiliateProductsListPage() {
  const { setBreadcrumbs } = useUIStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Imperialpedia', href: '/imperialpedia' }, { label: 'Affiliate Products' }]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['imperialpedia', 'affiliate-products', 'list'],
    queryFn: () => serviceClients.imperialpedia.get('/affiliate-products', { params: { status: 'all', limit: 100 } }).then((r) => r.data),
  });

  const archive = useMutation({
    mutationFn: (id: string) => serviceClients.imperialpedia.delete(`/affiliate-products/${id}`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'affiliate-products'] });
    },
    onError: (err) => setActionError(normalizeError(err as AxiosError).message),
  });

  const allItems = (data?.data?.items ?? []) as AffiliateProductRow[];
  const items = search
    ? allItems.filter((a) => a.product_name.toLowerCase().includes(search.toLowerCase()) || a.merchant_name.toLowerCase().includes(search.toLowerCase()))
    : allItems;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliate Products"
        description="Outbound CTA links with click tracking (imperialpedia-service)"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/imperialpedia/affiliate/report"><BarChart3 className="mr-2 h-4 w-4" /> Report</Link>
            </Button>
            <Button asChild>
              <Link href="/imperialpedia/affiliate/new"><Plus className="mr-2 h-4 w-4" /> New product</Link>
            </Button>
          </div>
        }
      />

      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search products or merchants…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No affiliate products found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.product_name}</div>
                      <div className="font-mono text-xs text-muted-foreground">/{row.slug}</div>
                    </TableCell>
                    <TableCell>{row.merchant_name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.category || '—'}</TableCell>
                    <TableCell><Badge className={STATUS_STYLES[row.status]}>{row.status}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{row.commission_rate != null ? `${row.commission_rate}%` : '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.clicks_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="Edit">
                          <Link href={`/imperialpedia/affiliate/${row.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        {row.status !== 'archived' && (
                          <Button
                            variant="ghost" size="icon" title="Archive"
                            onClick={() => window.confirm(`Archive "${row.product_name}"?`) && archive.mutate(row.id)}
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
