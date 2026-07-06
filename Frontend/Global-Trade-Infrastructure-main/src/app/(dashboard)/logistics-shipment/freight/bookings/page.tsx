'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFreightBookings, BookingStatus } from '@/api';
import { FreightNavTabs } from '../_components/freight-nav-tabs';
import { BOOKING_STATUS_COLORS, modeMeta } from '../_components/mode-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STATUS_OPTIONS: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'booking', label: 'Booking' },
  { value: 'booked', label: 'Booked' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];

export default function FreightBookingsPage() {
  const [status, setStatus] = useState<BookingStatus | 'all'>('all');
  const router = useRouter();
  const { data, isLoading } = useFreightBookings(status === 'all' ? {} : { status }, { poll: true });
  const bookings = data?.items ?? [];

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Freight Bookings</h1>
        <p className="text-sm text-muted-foreground">Every booking driven through the carrier fallback engine — DHL, FedEx, UPS and Maersk.</p>
      </div>

      <FreightNavTabs />

      <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus | 'all')}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>{STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>

      <Card>
        <CardContent className="p-0">
          {isLoading && <p className="text-sm text-muted-foreground py-10 text-center">Loading bookings…</p>}
          {!isLoading && bookings.length === 0 && <p className="text-sm text-muted-foreground py-10 text-center">No freight bookings match this filter.</p>}
          {!isLoading && bookings.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => {
                  const meta = modeMeta(b.mode);
                  return (
                    <TableRow key={b.id} className="cursor-pointer" onClick={() => router.push(`/logistics-shipment/freight/bookings/${b.id}`)}>
                      <TableCell className="font-medium uppercase">{b.carrier ?? '—'}</TableCell>
                      <TableCell><span className="flex items-center gap-1.5 text-xs"><meta.icon className={cn('h-3.5 w-3.5', meta.color)} /> {meta.label}</span></TableCell>
                      <TableCell className="font-mono text-xs">{b.tracking_number ?? '—'}</TableCell>
                      <TableCell className="text-xs">{b.amount != null ? `${b.currency} ${b.amount.toLocaleString()}` : '—'}</TableCell>
                      <TableCell><Badge variant="outline" className={cn('text-[9px] capitalize', BOOKING_STATUS_COLORS[b.status])}>{b.status.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.estimated_delivery ? format(new Date(b.estimated_delivery), 'MMM d, yyyy') : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(b.created_at), 'MMM d, yyyy')}</TableCell>
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
