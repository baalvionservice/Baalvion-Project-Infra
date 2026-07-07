'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFreightQuotes, FreightQuoteStatus } from '@/api';
import { FreightNavTabs } from '../_components/freight-nav-tabs';
import { QUOTE_STATUS_COLORS, modeMeta } from '../_components/mode-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STATUS_OPTIONS: { value: FreightQuoteStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'expired', label: 'Expired' },
  { value: 'converted', label: 'Converted' },
];

export default function FreightQuotesPage() {
  const [status, setStatus] = useState<FreightQuoteStatus | 'all'>('all');
  const router = useRouter();
  const { data, isLoading } = useFreightQuotes(status === 'all' ? {} : { status });
  const quotes = data?.items ?? [];

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Freight Quotes</h1>
          <p className="text-sm text-muted-foreground">Every quote request, fanned out across the carrier directory with a full charge breakdown.</p>
        </div>
        <Link href="/logistics-shipment/freight/quotes/new">
          <Button><Plus className="h-4 w-4 mr-1" /> New Quote</Button>
        </Link>
      </div>

      <FreightNavTabs />

      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v as FreightQuoteStatus | 'all')}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && <p className="text-sm text-muted-foreground py-10 text-center">Loading quotes…</p>}
          {!isLoading && quotes.length === 0 && (
            <p className="text-sm text-muted-foreground py-10 text-center">No freight quotes match this filter.</p>
          )}
          {!isLoading && quotes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Best Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => {
                  const meta = modeMeta(q.transportMode);
                  const best = [...(q.items ?? [])].sort((a, b) => a.totalAmount - b.totalAmount)[0];
                  return (
                    <TableRow key={q.id} className="cursor-pointer" onClick={() => router.push(`/logistics-shipment/freight/quotes/${q.id}`)}>
                      <TableCell className="font-medium">{q.origin?.country ?? '?'} → {q.destination?.country ?? '?'}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-xs"><meta.icon className={cn('h-3.5 w-3.5', meta.color)} /> {meta.label}</span>
                      </TableCell>
                      <TableCell>{q.items?.length ?? 0}</TableCell>
                      <TableCell>{best ? `${best.currency} ${best.totalAmount.toLocaleString()}` : '—'}</TableCell>
                      <TableCell><Badge variant="outline" className={cn('text-[9px] capitalize', QUOTE_STATUS_COLORS[q.status])}>{q.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-xs">{format(new Date(q.createdAt), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
