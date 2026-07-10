'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFreightQuote, useCarriers, useCreateFreightBooking, MarketplaceCarrier } from '@/api';
import { FreightNavTabs } from '../../_components/freight-nav-tabs';
import { modeMeta, QUOTE_STATUS_COLORS } from '../../_components/mode-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Trophy, Zap, DollarSign, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CODED_CONNECTORS: MarketplaceCarrier[] = ['dhl', 'fedex', 'ups', 'maersk'];

export default function FreightQuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: quote, isLoading } = useFreightQuote(params.id);
  const { data: carriersPage } = useCarriers({});
  const carriersById = new Map((carriersPage?.items ?? []).map((c) => [c.id, c]));
  const { toast } = useToast();
  const createBooking = useCreateFreightBooking();

  if (isLoading) return <main className="p-6"><p className="text-sm text-muted-foreground">Loading quote…</p></main>;
  if (!quote) return <main className="p-6"><p className="text-sm text-muted-foreground">Quote not found.</p></main>;

  const meta = modeMeta(quote.transportMode);
  const items = [...quote.items].sort((a, b) => a.totalAmount - b.totalAmount);
  const cheapestId = items[0]?.carrierId;
  const fastestId = [...items].sort((a, b) => (a.transitDays || 999) - (b.transitDays || 999))[0]?.carrierId;
  const bestId = [...quote.comparisons].sort((a, b) => b.overallScore - a.overallScore)[0]?.carrierId;
  const comparisonByCarrier = new Map(quote.comparisons.map((c) => [c.carrierId, c]));

  const handleSelect = async (connectorKey: MarketplaceCarrier) => {
    try {
      const booking = await createBooking.mutateAsync({
        preferred_carrier: connectorKey,
        shipment_id: quote.shipmentId ?? undefined,
        request: {
          mode: quote.transportMode ?? undefined,
          incoterm: quote.incoterm ?? undefined,
          origin: { country: (quote.origin as { country?: string })?.country ?? '' },
          destination: { country: (quote.destination as { country?: string })?.country ?? '' },
          pieces: [{ quantity: 1, weight_kg: Number((quote.cargo as Record<string, unknown>)?.chargeableWeightKg) || 1, length_cm: 1, width_cm: 1, height_cm: 1 }],
        },
      });
      toast({ title: 'Booking created', description: `${booking.carrier} · ${booking.tracking_number ?? 'pending tracking number'}` });
      router.push(`/logistics-shipment/freight/bookings/${booking.id}`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Booking failed', description: e instanceof Error ? e.message : 'Unexpected error.' });
    }
  };

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/logistics-shipment/freight/quotes')}><ChevronLeft className="h-4 w-4 mr-1" /> All Quotes</Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {quote.origin?.country ?? '?'} → {quote.destination?.country ?? '?'}
            <meta.icon className={cn('h-5 w-5', meta.color)} />
          </h1>
          <p className="text-sm text-muted-foreground">{meta.label} · {quote.incoterm ?? 'No incoterm'} · Requested {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : ''}</p>
        </div>
        <Badge variant="outline" className={cn('capitalize', QUOTE_STATUS_COLORS[quote.status])}>{quote.status}</Badge>
      </div>

      <FreightNavTabs />

      {quote.errors && quote.errors.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/40">
          <CardContent className="p-4 text-xs text-orange-700">
            {quote.errors.length} carrier(s) could not be quoted: {quote.errors.map((e) => e.carrierCode).join(', ')}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Carrier Comparison</CardTitle></CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No carrier could be quoted for this request.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Freight</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Terminal</TableHead>
                  <TableHead>Handling</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Transit</TableHead>
                  <TableHead>CO₂</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const carrier = item.carrierId ? carriersById.get(item.carrierId) : undefined;
                  const cmp = item.carrierId ? comparisonByCarrier.get(item.carrierId) : undefined;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {carrier?.name ?? item.carrierId ?? 'Unknown'}
                          {item.carrierId === cheapestId && <Badge variant="success" className="text-[8px]"><DollarSign className="h-2.5 w-2.5 mr-0.5" />Cheapest</Badge>}
                          {item.carrierId === fastestId && <Badge variant="info" className="text-[8px]"><Zap className="h-2.5 w-2.5 mr-0.5" />Fastest</Badge>}
                          {item.carrierId === bestId && <Badge variant="verified" className="text-[8px]"><Trophy className="h-2.5 w-2.5 mr-0.5" />Best</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{item.serviceLevel ?? '—'}</TableCell>
                      <TableCell className="text-xs">{item.currency} {item.baseFreight.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{item.currency} {item.fuelSurcharge.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{item.currency} {item.terminalCharge.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{item.currency} {item.handlingCharge.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{item.currency} {item.insuranceEstimate.toLocaleString()}</TableCell>
                      <TableCell className="text-sm font-bold">{item.currency} {item.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{item.transitDays ?? '—'}d</TableCell>
                      <TableCell className="text-xs">{item.carbonEstimateKg != null ? `${item.carbonEstimateKg.toFixed(1)} kg` : '—'}</TableCell>
                      <TableCell className="text-xs font-bold">{cmp ? (cmp.overallScore * 100).toFixed(0) : '—'}</TableCell>
                      <TableCell>
                        {carrier?.connectorKey ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={createBooking.isPending}
                            onClick={() => handleSelect(carrier.connectorKey as MarketplaceCarrier)}
                          >
                            {createBooking.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                            Select
                          </Button>
                        ) : (
                          <span className="text-[9px] text-muted-foreground italic" title="Booking commitment for dynamically-added carriers with no coded connector is not yet wired to the booking engine.">
                            Booking not yet available
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Cargo Details</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground text-xs">Cargo Type</span><p className="font-bold">{(quote.cargo as Record<string, unknown>)?.cargoType as string ?? '—'}</p></div>
          <div><span className="text-muted-foreground text-xs">Commodity</span><p className="font-bold">{(quote.cargo as Record<string, unknown>)?.commodity as string ?? '—'}</p></div>
          <div><span className="text-muted-foreground text-xs">HS Code</span><p className="font-bold">{(quote.cargo as Record<string, unknown>)?.hsCode as string ?? '—'}</p></div>
          <div><span className="text-muted-foreground text-xs">Chargeable Weight</span><p className="font-bold">{(quote.cargo as Record<string, unknown>)?.chargeableWeightKg as number ?? '—'} kg</p></div>
          <div><span className="text-muted-foreground text-xs">Requested Pickup</span><p className="font-bold">{quote.requestedPickup ?? '—'}</p></div>
          <div><span className="text-muted-foreground text-xs">Valid Until</span><p className="font-bold">{quote.validUntil ? new Date(quote.validUntil).toLocaleString() : '—'}</p></div>
        </CardContent>
      </Card>
    </main>
  );
}
