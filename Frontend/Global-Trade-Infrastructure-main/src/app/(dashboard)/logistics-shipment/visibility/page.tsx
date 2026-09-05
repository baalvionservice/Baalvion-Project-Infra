/**
 * @file logistics-shipment/visibility/page.tsx
 * @description Shipment Visibility — the counterparty list.
 *
 * Every other logistics screen in this app is an OPERATOR view: it lists whatever the tenant owns.
 * This one lists what the signed-in org is a party to. The filtering is the server's job
 * (/dashboard/shipments applies the buyer/seller scope from the verified identity), so this page
 * never receives a shipment it then has to hide.
 */
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Ship, Loader2, Anchor, Plane, Truck, Train, Search, ArrowRight, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PATHS } from '@/lib/paths';
import { useTradeShipments, useClearanceBottlenecks, type TradeShipment } from '@/api/trade-shipments';

const STATUS_TONE: Record<string, string> = {
  delivered: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  in_transit: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  port_processing: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30',
  customs_clearance: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  customs_hold: 'bg-red-500/10 text-red-700 border-red-500/30',
  delayed: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
  exception: 'bg-red-500/10 text-red-700 border-red-500/30',
  cancelled: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
};

const MODE_ICON: Record<string, typeof Ship> = { sea: Ship, air: Plane, road: Truck, rail: Train };

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'in_transit,port_processing,customs_clearance,released', label: 'Moving' },
  { key: 'customs_hold,delayed,exception', label: 'Needs attention' },
  { key: 'delivered', label: 'Delivered' },
];

function fmtDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Days until (positive) or since (negative) a date, or null when there isn't one. */
function daysFromNow(value: string | null) {
  if (!value) return null;
  return Math.round((new Date(value).getTime() - Date.now()) / 86_400_000);
}

function EtaCell({ shipment }: { shipment: TradeShipment }) {
  if (shipment.actual_arrival) {
    return (
      <div>
        <p className="text-sm font-bold">{fmtDate(shipment.actual_arrival)}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Arrived</p>
      </div>
    );
  }
  const days = daysFromNow(shipment.estimated_arrival);
  return (
    <div>
      <p className="text-sm font-bold">{fmtDate(shipment.estimated_arrival)}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {days === null ? 'No ETA on file' : days >= 0 ? `In ${days}d` : `${Math.abs(days)}d overdue`}
      </p>
    </div>
  );
}

export default function ShipmentVisibilityPage() {
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const { data, isLoading, error } = useTradeShipments(status === 'all' ? {} : { status });
  const { data: clearance } = useClearanceBottlenecks();

  const items = useMemo(() => {
    const rows = data?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) =>
      [s.shipment_no, s.vessel_name, s.container_no, s.bill_of_lading_no, s.origin_port, s.destination_port]
        .some((field) => field && field.toLowerCase().includes(q)));
  }, [data, query]);

  return (
    <main className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Shipment Visibility</p>
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-[0.9]">Your Trades<br />In Motion.</h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Shipments your organisation is a party to, as buyer or as seller. Vessel, port calls, ETA,
            documents and the clearance clock — the same record your counterparty sees.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Shipment, vessel, container, B/L..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 pl-11 rounded-2xl border-2 font-medium"
          />
        </div>
      </div>

      {clearance && clearance.stages.length > 0 && (
        <Card className="border-2 rounded-2xl shadow-none">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                <p className="text-sm font-black uppercase tracking-tighter">Clearance Performance</p>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {clearance.sample_rows} stage records · {clearance.total_hours}h total
              </p>
            </div>

            {/* Biggest time sink first. The p90 sits next to the mean because a
                delivery promise is made against the tail, not the average. */}
            <div className="space-y-2">
              {clearance.stages.slice(0, 5).map((stage) => (
                <div key={stage.stage} className="grid gap-3 sm:grid-cols-12 items-center p-3 rounded-xl bg-muted/20">
                  <div className="sm:col-span-4 min-w-0">
                    <p className="text-sm font-bold truncate">{stage.label}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {stage.owner ? String(stage.owner).replace(/_/g, ' ') : 'unassigned'} · {stage.count}x
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm font-black tabular-nums">{stage.mean_hours}h</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">mean</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm font-black tabular-nums">{stage.p90_hours}h</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">p90</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className={cn('text-sm font-black tabular-nums', stage.blocked_hours > 0 && 'text-orange-600')}>
                      {stage.blocked_hours}h
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">blocked</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm font-black tabular-nums">{stage.share_pct}%</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">of total</p>
                  </div>
                </div>
              ))}
            </div>

            {clearance.vital_few.length > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className="font-black uppercase tracking-widest text-[10px]">Where the time is:</span>{' '}
                {clearance.vital_few.join(', ')} hold 80% of the clock.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              'px-4 py-2 rounded-full border-2 text-[11px] font-black uppercase tracking-widest transition-colors',
              status === f.key ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted/50',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <Card className="border-2 rounded-2xl">
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-sm font-black uppercase tracking-wide">Nothing to show</p>
            <p className="text-sm text-muted-foreground">
              Your account has no buyer or seller role on this platform, so no trade is scoped to it yet.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && items.length === 0 && (
        <Card className="border-2 rounded-2xl">
          <CardContent className="p-12 text-center space-y-2">
            <Anchor className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-black uppercase tracking-wide">No shipments</p>
            <p className="text-sm text-muted-foreground">
              {query ? 'Nothing matches that search.' : 'No shipment is currently scoped to your organisation.'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((s) => {
          const ModeIcon = MODE_ICON[s.mode ?? ''] ?? Ship;
          return (
            <Link key={s.id} href={`${PATHS.SHIPMENT_VISIBILITY}/${s.id}`} className="block group">
              <Card className="border-2 rounded-2xl shadow-none transition-colors group-hover:border-primary/50">
                <CardContent className="p-6 grid gap-6 md:grid-cols-12 items-center">
                  <div className="md:col-span-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <ModeIcon className="h-4 w-4 text-primary" />
                      <p className="text-sm font-black uppercase tracking-tight">{s.shipment_no}</p>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {s.tradeOperation?.reference_no || s.tradeOperation?.commodity || 'Trade operation'}
                    </p>
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <p className="text-sm font-bold">
                      {s.origin_port || '—'} <span className="text-muted-foreground">→</span> {s.destination_port || '—'}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {s.vessel_name ? `${s.vessel_name}${s.voyage_no ? ` · ${s.voyage_no}` : ''}` : 'Vessel not assigned'}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <EtaCell shipment={s} />
                  </div>

                  <div className="md:col-span-3">
                    <Badge variant="outline" className={cn('rounded-full border-2 font-black uppercase text-[10px] tracking-widest', STATUS_TONE[s.status])}>
                      {s.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
