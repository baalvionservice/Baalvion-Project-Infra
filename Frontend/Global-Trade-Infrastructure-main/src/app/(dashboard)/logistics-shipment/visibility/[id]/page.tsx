/**
 * @file logistics-shipment/visibility/[id]/page.tsx
 * @description Shipment Visibility — the shared counterparty record for one trade.
 *
 * Reads entirely from the party-scoped /dashboard/shipments surface, so a buyer and a seller in
 * different orgs open the same URL and each get the trade they are party to — and a 404 on anything
 * else. Six questions, in the order someone actually asks them: which ship, where is it, when does
 * it land, what happened so far, where is the paperwork time going, and what documents exist.
 *
 * On vessel position: the server derives it from port-call rows, not from an AIS fix, and says so
 * in `basis`. This page renders it as a LAST CONFIRMED position with the timestamp attached. It
 * does not draw a ship on a map at coordinates nobody measured.
 */
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Ship, Loader2, ChevronLeft, Anchor, Clock, FileText, AlertTriangle,
  CheckCircle2, CircleDot, Timer, Radio, Map,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PATHS } from '@/lib/paths';
import {
  useTradeShipment, useTradeShipmentSchedule, useTradeShipmentTimeline,
  useTradeShipmentClearance, useTradeShipmentDocuments,
  type PortCall, type ClearanceStage, type VesselPosition,
} from '@/api/trade-shipments';

const STATUS_TONE: Record<string, string> = {
  delivered: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  in_transit: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  customs_hold: 'bg-red-500/10 text-red-700 border-red-500/30',
  delayed: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
  exception: 'bg-red-500/10 text-red-700 border-red-500/30',
};

function fmtDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function relative(value: string | null | undefined) {
  if (!value) return null;
  const hours = Math.round((Date.now() - new Date(value).getTime()) / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function Field({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-bold', tone)}>{value ?? '—'}</p>
    </div>
  );
}

/**
 * The vessel's last confirmed whereabouts. Deliberately worded as "last confirmed" rather than
 * "live" — see the file header.
 */
function PositionCard({ position }: { position: VesselPosition }) {
  const where = position.currentCall || position.lastDeparted;
  const stateLabel = position.state === 'in_port'
    ? `Alongside ${position.currentCall?.portName || position.currentCall?.portCode || 'berth'}`
    : position.state === 'at_sea'
      ? `At sea — departed ${position.lastDeparted?.portName || position.lastDeparted?.portCode || 'last port'}`
      : 'No active voyage on file';

  return (
    <Card className="border-2 rounded-2xl shadow-none">
      <CardHeader className="border-b bg-muted/10 p-6">
        <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" /> Vessel Position
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <p className="text-lg font-black tracking-tight">{stateLabel}</p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Last confirmed" value={position.observedAt ? fmtDateTime(position.observedAt) : 'Not yet reported'} />
          <Field label="Next port" value={position.nextCall?.portName || position.nextCall?.portCode || '—'} />
        </div>

        {/*
          The provenance line. Without it a schedule inference reads as a live GPS fix, which is the
          single easiest way for a tracking screen to lie to the person relying on it.
        */}
        <div className="rounded-xl border-2 border-dashed p-4 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">How this is known</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Derived from recorded port calls
            {where?.portName ? ` (last: ${where.portName})` : ''}
            {position.observedAt ? `, ${relative(position.observedAt)}` : ''}.
            No live AIS or GPS feed is connected, so no coordinates are shown.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/** One stop on the rotation. `actual*` present means it happened; otherwise it is still a plan. */
function PortCallRow({ call, highlight }: { call: PortCall; highlight?: string }) {
  const done = !!call.actualDeparture;
  const here = !!call.actualArrival && !call.actualDeparture;
  const Icon = done ? CheckCircle2 : here ? CircleDot : Clock;

  return (
    <div className={cn('flex gap-4 p-4 rounded-xl border-2', here ? 'border-primary/50 bg-primary/5' : 'border-transparent bg-muted/20')}>
      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', done ? 'text-emerald-600' : here ? 'text-primary' : 'text-muted-foreground')} />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-sm font-black uppercase tracking-tight">{call.portName || call.portCode || 'Port call'}</p>
          {call.countryCode && <span className="text-[10px] font-bold text-muted-foreground">{call.countryCode}</span>}
          {highlight && (
            <Badge variant="outline" className="rounded-full text-[9px] font-black uppercase tracking-widest border-2">{highlight}</Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          <p className="text-muted-foreground">
            Arrive <span className="font-bold text-foreground">{fmtDateTime(call.actualArrival || call.eta)}</span>
            {call.actualArrival ? ' (actual)' : ' (planned)'}
          </p>
          <p className="text-muted-foreground">
            Depart <span className="font-bold text-foreground">{fmtDateTime(call.actualDeparture || call.etd)}</span>
            {call.actualDeparture ? ' (actual)' : ' (planned)'}
          </p>
        </div>
        {call.delayHours !== null && call.delayHours !== undefined && call.delayHours !== 0 && (
          <p className={cn('text-[10px] font-black uppercase tracking-widest', call.delayHours > 0 ? 'text-orange-600' : 'text-emerald-600')}>
            {call.delayHours > 0 ? `${call.delayHours}h late` : `${Math.abs(call.delayHours)}h early`} vs published ETA
          </p>
        )}
      </div>
    </div>
  );
}

/** One clearance stage: how long it took, and how much of that was spent blocked on someone. */
function ClearanceStageRow({ stage }: { stage: ClearanceStage }) {
  const blockedShare = stage.elapsed_hours > 0
    ? Math.min(100, Math.round((stage.blocked_hours / stage.elapsed_hours) * 100))
    : 0;

  return (
    <div className="p-4 rounded-xl bg-muted/20 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-tight truncate">{stage.label}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {stage.owner ? `Owned by ${String(stage.owner).replace(/_/g, ' ')}` : 'Unassigned'}
            {stage.touch_count > 1 && ` · reopened ${stage.touch_count - 1}×`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black">{stage.elapsed_hours}h</p>
          {stage.target_hours !== null && (
            <p className={cn('text-[10px] font-black uppercase tracking-widest', stage.breached ? 'text-red-600' : 'text-muted-foreground')}>
              target {stage.target_hours}h
            </p>
          )}
        </div>
      </div>

      {stage.blocked_hours > 0 && (
        <>
          <Progress value={blockedShare} className="h-1.5" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
            {stage.blocked_hours}h blocked{stage.blocked_by ? ` on ${String(stage.blocked_by).replace(/_/g, ' ')}` : ''}
          </p>
        </>
      )}
    </div>
  );
}

export default function ShipmentVisibilityDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: shipment, isLoading, error } = useTradeShipment(id);
  const { data: schedule } = useTradeShipmentSchedule(id);
  const { data: timeline } = useTradeShipmentTimeline(id);
  const { data: clearance } = useTradeShipmentClearance(id);
  const { data: docs } = useTradeShipmentDocuments(id);

  if (isLoading) {
    return (
      <main className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  // The server returns 404 both for "does not exist" and "not yours", on purpose —
  // so the copy here must not claim to know which.
  if (error || !shipment) {
    return (
      <main className="py-24 text-center space-y-4">
        <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-lg font-black uppercase tracking-tight">Shipment not available</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          This shipment does not exist, or your organisation is not a party to it.
        </p>
        <Link href={PATHS.SHIPMENT_VISIBILITY} className="inline-flex items-center gap-2 text-sm font-bold text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to your shipments
        </Link>
      </main>
    );
  }

  const rotation = schedule?.voyage?.portCalls ?? [];
  const position = schedule?.vesselPosition;
  const entries = [...(timeline?.entries ?? [])].reverse();

  return (
    <main className="space-y-8 pb-24">
      <div className="border-b pb-8 space-y-4">
        <Link href={PATHS.SHIPMENT_VISIBILITY} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-3 w-3" /> Your shipments
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">
              {shipment.tradeOperation?.reference_no || 'Trade operation'}
              {shipment.tradeOperation?.commodity ? ` · ${shipment.tradeOperation.commodity}` : ''}
            </p>
            <h2 className="text-4xl font-black tracking-tighter uppercase leading-[0.9]">{shipment.shipment_no}</h2>
            <p className="text-sm font-bold text-muted-foreground">
              {shipment.origin_port || '—'} → {shipment.destination_port || '—'}
            </p>
          </div>
          <Badge variant="outline" className={cn('rounded-full border-2 font-black uppercase text-[10px] tracking-widest px-4 py-2', STATUS_TONE[shipment.status])}>
            {shipment.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {/* ── Which ship, and when ── */}
          <Card className="border-2 rounded-2xl shadow-none">
            <CardHeader className="border-b bg-muted/10 p-6">
              <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                <Ship className="h-4 w-4 text-primary" /> Carriage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid gap-6 sm:grid-cols-3">
              <Field label="Vessel" value={schedule?.voyage?.vessel?.name || shipment.vessel_name || 'Not assigned'} />
              <Field label="Voyage" value={schedule?.voyage?.voyageNo || shipment.voyage_no} />
              <Field label="Carrier" value={shipment.carrier_name} />
              <Field label="Container" value={shipment.container_no} />
              <Field label="Bill of lading" value={shipment.bill_of_lading_no} />
              <Field label="Incoterm" value={shipment.incoterm} />
              <Field
                label="Departure"
                value={shipment.actual_departure ? `${fmtDate(shipment.actual_departure)} (actual)` : `${fmtDate(shipment.estimated_departure)} (planned)`}
              />
              <Field
                label="Arrival"
                value={shipment.actual_arrival ? `${fmtDate(shipment.actual_arrival)} (actual)` : `${fmtDate(shipment.estimated_arrival)} (planned)`}
              />
              <Field label="Mode" value={shipment.mode ? shipment.mode.toUpperCase() : '—'} />
            </CardContent>
            {schedule && !schedule.booked && (
              <div className="px-6 pb-6">
                <p className="text-xs text-muted-foreground rounded-xl border-2 border-dashed p-4">
                  {schedule.note || 'This shipment is not booked on a scheduled sailing, so no port rotation is available.'}
                </p>
              </div>
            )}
          </Card>

          {/* ── Where the ship has actually been ── */}
          {rotation.length > 0 && (
            <Card className="border-2 rounded-2xl shadow-none">
              <CardHeader className="border-b bg-muted/10 p-6">
                <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                  <Anchor className="h-4 w-4 text-primary" /> Port Rotation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-2">
                {rotation.map((call) => (
                  <PortCallRow
                    key={call.id}
                    call={call}
                    highlight={
                      call.id === schedule?.loadCall?.id ? 'Your load'
                        : call.id === schedule?.dischargeCall?.id ? 'Your discharge'
                          : undefined
                    }
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Where the paperwork time went ── */}
          {clearance && clearance.stages.length > 0 && (
            <Card className="border-2 rounded-2xl shadow-none">
              <CardHeader className="border-b bg-muted/10 p-6">
                <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" /> Clearance Clock
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="Elapsed" value={`${clearance.totals.elapsed_days}d`} />
                  <Field label="Blocked" value={`${clearance.totals.blocked_hours}h`} tone="text-orange-600" />
                  <Field label="Breached stages" value={clearance.totals.breached_stages} tone={clearance.totals.breached_stages ? 'text-red-600' : undefined} />
                  <Field label="Rework" value={`${clearance.totals.rework_touches} touches`} />
                </div>
                <div className="space-y-2">
                  {/* Biggest time sink first — that is the only ordering anyone acts on. */}
                  {clearance.bottlenecks.map((stage) => (
                    <ClearanceStageRow key={stage.stage} stage={stage} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── What has happened, newest first ── */}
          <Card className="border-2 rounded-2xl shadow-none">
            <CardHeader className="border-b bg-muted/10 p-6 flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-tighter">Event Timeline</CardTitle>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{timeline?.count ?? 0} entries</span>
            </CardHeader>
            <CardContent className="p-6">
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events recorded on this shipment yet.</p>
              ) : (
                <div className="space-y-4">
                  {entries.map((e) => (
                    <div key={e.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                      <div className="w-32 shrink-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{fmtDateTime(e.at)}</p>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-bold">{e.title}</p>
                        {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                        <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <span>{e.kind.replace(/_/g, ' ')}</span>
                          {e.location?.name && <span>{e.location.name}</span>}
                          {/* Simulated entries are labelled rather than filtered — hiding them would
                              overstate how much of this timeline is observed fact. */}
                          {e.source && <span className={cn(e.source === 'simulated' && 'text-amber-600')}>{e.source}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {position && <PositionCard position={position} />}

          <Link
            href={`${PATHS.SHIPMENT_VISIBILITY}/${shipment.id}/live-map`}
            className="flex items-center justify-between gap-3 p-5 rounded-2xl border-2 hover:border-primary/50 transition-colors group"
          >
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-tight">
              <Map className="h-4 w-4 text-primary" /> Position map &amp; checkpoints
            </span>
            <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>

          <Card className="border-2 rounded-2xl shadow-none">
            <CardHeader className="border-b bg-muted/10 p-6">
              <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {!docs || docs.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents filed against this shipment.</p>
              ) : (
                docs.documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold truncate">{d.doc_type.replace(/_/g, ' ')}</p>
                    <Badge variant="outline" className="rounded-full border-2 text-[9px] font-black uppercase tracking-widest shrink-0">
                      {d.status || 'filed'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-2 rounded-2xl shadow-none">
            <CardHeader className="border-b bg-muted/10 p-6">
              <CardTitle className="text-sm font-black uppercase tracking-tighter">Counterparties</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid gap-4">
              <Field label="Buyer" value={shipment.tradeOperation?.buyer_org_id} />
              <Field label="Seller" value={shipment.tradeOperation?.seller_org_id} />
              <Field label="Operation status" value={shipment.tradeOperation?.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
