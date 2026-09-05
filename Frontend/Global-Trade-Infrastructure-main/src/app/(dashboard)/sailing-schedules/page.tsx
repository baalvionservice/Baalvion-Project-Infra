'use client';

/**
 * @file sailing-schedules/page.tsx
 * @description Sailing Schedules — "which ship sails from where, when, and how long
 * does it take". Four views over the same real schedule data: a lane search
 * (port → port, direct or via a transhipment hub), a per-port departures/arrivals
 * board, live vessel positions, and where my own booked cargo is.
 *
 * Every figure shown is read from a stored schedule row. Transit time is labelled with
 * its basis so a published-schedule number is never confused with an estimate, and an
 * empty lane says so plainly instead of showing a fabricated sailing.
 */

import { useEffect, useState } from 'react';
import {
  sailingScheduleService, type PortCall, type Vessel, type VesselPosition,
  type ShipmentSchedule, type RouteSearchResult, type SailingRoute, type RouteLeg,
  type RouteConnection,
} from '@/services/sailing-schedule-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Ship, Anchor, Search, Loader2, ArrowRight, Clock, MapPin, Navigation, AlertCircle, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'lane' | 'port' | 'vessels' | 'cargo';

const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

export default function SailingSchedulesPage() {
  const [tab, setTab] = useState<Tab>('lane');

  return (
    <main className="flex-1 space-y-8 p-4 md:p-8 bg-muted/20 min-h-screen">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Ocean Freight</p>
        <h2 className="text-3xl font-bold tracking-tight">Sailing Schedules</h2>
        <p className="text-muted-foreground">
          Find a sailing between two ports, see what&apos;s calling at a port, and track where a vessel is now.
        </p>
      </div>

      <div className="flex gap-2 border-b">
        {([
          { key: 'lane', label: 'Find a sailing', icon: Search },
          { key: 'port', label: 'Port schedule', icon: Anchor },
          { key: 'vessels', label: 'Vessel tracking', icon: Navigation },
          { key: 'cargo', label: 'My cargo', icon: Package },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'lane' && <LaneSearch />}
      {tab === 'port' && <PortSchedule />}
      {tab === 'vessels' && <VesselTracking />}
      {tab === 'cargo' && <MyCargo />}
    </main>
  );
}

/* ── My cargo: where each of my shipments actually is ──────────────────────── */

function MyCargo() {
  const [schedules, setSchedules] = useState<ShipmentSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const shipments = await sailingScheduleService.myShipments();
        const results = await Promise.allSettled(
          shipments.map((s) => sailingScheduleService.shipmentSchedule(s.id)),
        );
        setSchedules(results
          .filter((r): r is PromiseFulfilledResult<ShipmentSchedule | null> => r.status === 'fulfilled')
          .map((r) => r.value)
          .filter((s): s is ShipmentSchedule => !!s));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (schedules.length === 0) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="py-14 text-center space-y-3">
          <Package className="h-10 w-10 mx-auto text-muted-foreground opacity-20" />
          <p className="font-semibold">No shipments yet</p>
          <p className="text-sm text-muted-foreground">Shipments you book will show their sailing and live position here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map((s) => (
        <Card key={s.shipmentId} className="shadow-none border">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" /> {s.shipmentNo || 'Shipment'}
                </CardTitle>
                <CardDescription>
                  {s.booked
                    ? <>On {s.voyage?.vessel?.name} · voyage {s.voyage?.voyageNumber}</>
                    : s.note}
                </CardDescription>
              </div>
              {s.booked && s.vesselPosition && <StateBadge state={s.vesselPosition.state} />}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {s.booked ? (
              <>
                <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  {s.loadCall && <PortEndpoint label="Loads" call={s.loadCall} time={s.loadCall.actualDeparture || s.loadCall.etd} />}
                  <ArrowRight className="hidden sm:block h-5 w-5 text-muted-foreground mx-auto" />
                  {s.dischargeCall && <PortEndpoint label="Discharges" call={s.dischargeCall} time={s.dischargeCall.actualArrival || s.dischargeCall.eta} />}
                </div>
                {s.vesselPosition && (
                  <div className="border-t pt-3 text-sm flex flex-wrap gap-x-6 gap-y-1">
                    <span className="text-muted-foreground">
                      Vessel now:{' '}
                      <span className="font-semibold text-foreground">
                        {s.vesselPosition.currentCall
                          ? `at ${s.vesselPosition.currentCall.portName || s.vesselPosition.currentCall.portCode}`
                          : s.vesselPosition.state === 'at_sea' ? 'at sea' : 'position unknown'}
                      </span>
                    </span>
                    {s.vesselPosition.nextCall && (
                      <span className="text-muted-foreground">
                        Next call:{' '}
                        <span className="font-semibold text-foreground">
                          {s.vesselPosition.nextCall.portName || s.vesselPosition.nextCall.portCode}
                        </span>{' '}
                        {fmtDate(s.vesselPosition.nextCall.eta)}
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                {s.vesselName || s.voyageNo
                  ? <>Recorded as {s.vesselName || 'vessel'} {s.voyageNo ? `· ${s.voyageNo}` : ''} (free text — not linked to a schedule)</>
                  : 'No vessel recorded.'}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Lane search: port → port, direct or via a hub ─────────────────────────── */

function LaneSearch() {
  const [fromPort, setFromPort] = useState('');
  const [toPort, setToPort] = useState('');
  const [allowTranshipment, setAllowTranshipment] = useState(true);
  const [result, setResult] = useState<RouteSearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!fromPort.trim() || !toPort.trim()) return;
    setLoading(true);
    try {
      setResult(await sailingScheduleService.findRoutes(
        fromPort.trim().toUpperCase(),
        toPort.trim().toUpperCase(),
        { maxLegs: allowTranshipment ? 3 : 1 },
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-none border">
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label>From port (UN/LOCODE)</Label>
              <Input placeholder="e.g. INNSA" value={fromPort} onChange={(e) => setFromPort(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} />
            </div>
            <div className="space-y-2">
              <Label>To port (UN/LOCODE)</Label>
              <Input placeholder="e.g. NLRTM" value={toPort} onChange={(e) => setToPort(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} />
            </div>
            <Button onClick={run} disabled={loading || !fromPort.trim() || !toPort.trim()} className="h-10">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer w-fit">
            <input type="checkbox" className="accent-primary h-4 w-4" checked={allowTranshipment}
                   onChange={(e) => setAllowTranshipment(e.target.checked)} />
            Include transhipment (change vessel at a hub) — most long-haul lanes have no direct service
          </label>
        </CardContent>
      </Card>

      {result && result.routes.length === 0 && (
        <Card className="border-dashed shadow-none">
          <CardContent className="py-14 text-center space-y-3">
            <Ship className="h-10 w-10 mx-auto text-muted-foreground opacity-20" />
            <p className="font-semibold">No routing found on this lane</p>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">{result.note}</p>
          </CardContent>
        </Card>
      )}

      {result && result.routes.length > 0 && (
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{result.routes.length}</span> option
          {result.routes.length === 1 ? '' : 's'} {result.lane.fromPort} → {result.lane.toPort}
          {' · '}{result.directCount} direct, {result.transhipmentCount} via a hub
          {' · '}connections need at least {result.params.minConnectionHours}h at the hub
        </p>
      )}

      {result?.routes.map((route, idx) => <RouteCard key={idx} route={route} />)}
    </div>
  );
}

function RouteCard({ route }: { route: SailingRoute }) {
  const cutoff = route.legs[0]?.loadCall.cutoffAt;
  return (
    <Card className="shadow-none border">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="text-lg flex items-center gap-2">
              {route.legs[0]?.loadCall.portCode}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              {route.legs[route.legs.length - 1]?.dischargeCall.portCode}
            </CardTitle>
            {/* div, not CardDescription — that renders a <p>, and Badge renders a div;
                nesting one in a <p> is invalid HTML and React reports it as a hydration error. */}
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-1.5">
              {route.transhipments === 0 ? (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">Direct</Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
                  {route.transhipments} transhipment{route.transhipments > 1 ? 's' : ''} via {route.transhipmentPorts.join(' → ')}
                </Badge>
              )}
              <span>{route.legs.length} vessel{route.legs.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">{route.totalTransitDays} days</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Port to port, from published schedule</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        {route.legs.map((leg, i) => (
          <div key={leg.loadCall.id}>
            <LegRow leg={leg} />
            {route.connections[i] && <ConnectionRow connection={route.connections[i]} />}
          </div>
        ))}
        {cutoff && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3 mt-4">
            <Clock className="h-3.5 w-3.5" />
            Cargo cut-off <span className="font-semibold text-foreground">{fmtDateTime(cutoff)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LegRow({ leg }: { leg: RouteLeg }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-sm flex items-center gap-2">
          <Ship className="h-4 w-4 text-primary" />
          {leg.voyage.vessel?.name || 'Vessel'}
          <span className="text-muted-foreground font-normal">· voyage {leg.voyage.voyageNumber}</span>
        </p>
        <span className="text-xs text-muted-foreground tabular-nums">{leg.transitDays} days at sea</span>
      </div>
      {(leg.voyage.serviceName || leg.voyage.vessel?.capacityTeu) && (
        <p className="text-xs text-muted-foreground -mt-1">
          {leg.voyage.serviceName || 'Service not specified'}
          {leg.voyage.vessel?.capacityTeu ? ` · ${leg.voyage.vessel.capacityTeu.toLocaleString()} TEU` : ''}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <PortEndpoint label="Departs" call={leg.loadCall} time={leg.departure} />
        <ArrowRight className="hidden sm:block h-5 w-5 text-muted-foreground mx-auto" />
        <PortEndpoint label="Arrives" call={leg.dischargeCall} time={leg.arrival} />
      </div>
    </div>
  );
}

function ConnectionRow({ connection }: { connection: RouteConnection }) {
  return (
    <div className="flex items-center gap-3 py-3 pl-4">
      <div className="flex flex-col items-center">
        <div className="h-3 w-px bg-border" />
        <Anchor className="h-4 w-4 text-amber-600" />
        <div className="h-3 w-px bg-border" />
      </div>
      <p className="text-xs text-muted-foreground">
        Transhipped at{' '}
        <span className="font-semibold text-foreground">{connection.portName || connection.portCode}</span>
        {' · '}
        <span className="font-semibold text-foreground">{connection.waitDays} day{connection.waitDays === 1 ? '' : 's'}</span>
        {' '}on the quay, then loads onto voyage {connection.toVoyage}
      </p>
    </div>
  );
}

function PortEndpoint({ label, call, time }: { label: string; call: PortCall; time: string | null }) {
  const isActual = label === 'Departs' ? !!call.actualDeparture : !!call.actualArrival;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-semibold flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        {call.portName || call.portCode}
        <span className="text-xs text-muted-foreground font-normal">({call.portCode})</span>
      </p>
      {/* div, not p — Badge renders a div and nesting one in a <p> is invalid HTML
          (React reports it as a hydration error). */}
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        {fmtDateTime(time)}
        {isActual && <Badge variant="outline" className="text-[9px] h-4 px-1.5">actual</Badge>}
      </div>
      {call.delayHours != null && call.delayHours > 0 && (
        <p className="text-xs text-amber-600 font-medium">{call.delayHours}h behind schedule</p>
      )}
    </div>
  );
}

/* ── Port schedule board ───────────────────────────────────────────────────── */

function PortSchedule() {
  const [portCode, setPortCode] = useState('');
  const [departures, setDepartures] = useState<PortCall[]>([]);
  const [arrivals, setArrivals] = useState<PortCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const run = async () => {
    if (!portCode.trim()) return;
    setLoading(true);
    try {
      const code = portCode.trim().toUpperCase();
      const [dep, arr] = await Promise.allSettled([
        sailingScheduleService.departures(code),
        sailingScheduleService.arrivals(code),
      ]);
      if (dep.status === 'fulfilled') setDepartures(dep.value);
      if (arr.status === 'fulfilled') setArrivals(arr.value);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-none border">
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label>Port (UN/LOCODE)</Label>
              <Input placeholder="e.g. INNSA" value={portCode} onChange={(e) => setPortCode(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} />
            </div>
            <Button onClick={run} disabled={loading || !portCode.trim()} className="h-10">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Anchor className="mr-2 h-4 w-4" />}
              Load board
            </Button>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ScheduleBoard title="Departures" icon={Navigation} calls={departures} timeField="etd" />
          <ScheduleBoard title="Arrivals" icon={Anchor} calls={arrivals} timeField="eta" />
        </div>
      )}
    </div>
  );
}

function ScheduleBoard({ title, icon: Icon, calls, timeField }: {
  title: string; icon: typeof Anchor; calls: PortCall[]; timeField: 'eta' | 'etd';
}) {
  return (
    <Card className="shadow-none border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" /> {title}
          <Badge variant="outline" className="ml-auto">{calls.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {calls.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No {title.toLowerCase()} scheduled at this port.
          </p>
        ) : (
          <div className="divide-y">
            {calls.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-0.5">
                  <p className="font-semibold text-sm truncate">
                    {c.voyage?.vessel?.name || 'Vessel'}
                    <span className="text-muted-foreground font-normal"> · {c.voyage?.voyageNumber}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeField === 'etd'
                      ? <>to {c.voyage?.destinationPortCode || '—'}</>
                      : <>from {c.voyage?.originPortCode || '—'}</>}
                    {c.terminal ? ` · ${c.terminal}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums">{fmtDate(c[timeField])}</p>
                  <p className="text-xs text-muted-foreground">
                    {c[timeField] ? new Date(c[timeField]!).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Vessel tracking ───────────────────────────────────────────────────────── */

function VesselTracking() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [positions, setPositions] = useState<Record<string, VesselPosition>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await sailingScheduleService.listVessels();
        setVessels(list);
        const results = await Promise.allSettled(list.map((v) => sailingScheduleService.vesselPosition(v.id)));
        const map: Record<string, VesselPosition> = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled' && r.value) map[list[i].id] = r.value;
        });
        setPositions(map);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (vessels.length === 0) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="py-14 text-center space-y-3">
          <Ship className="h-10 w-10 mx-auto text-muted-foreground opacity-20" />
          <p className="font-semibold">No vessels on file</p>
          <p className="text-sm text-muted-foreground">
            Vessels appear here once schedule data is loaded from a carrier feed or entered by an operator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {vessels.map((v) => {
        const pos = positions[v.id];
        return (
          <Card key={v.id} className="shadow-none border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <CardTitle className="text-base flex items-center gap-2 truncate">
                    <Ship className="h-4 w-4 text-primary shrink-0" /> {v.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {v.imoNumber ? `IMO ${v.imoNumber}` : 'IMO not on file'}
                    {v.operatorName ? ` · ${v.operatorName}` : ''}
                    {v.capacityTeu ? ` · ${v.capacityTeu.toLocaleString()} TEU` : ''}
                  </CardDescription>
                </div>
                <StateBadge state={pos?.state} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {pos?.currentCall && (
                <Row label="At berth" value={`${pos.currentCall.portName || pos.currentCall.portCode}`}
                     sub={`since ${fmtDateTime(pos.currentCall.actualArrival)}`} />
              )}
              {pos?.lastDeparted && !pos?.currentCall && (
                <Row label="Departed" value={`${pos.lastDeparted.portName || pos.lastDeparted.portCode}`}
                     sub={fmtDateTime(pos.lastDeparted.actualDeparture || pos.lastDeparted.etd)} />
              )}
              {pos?.nextCall ? (
                <Row label="Next port" value={`${pos.nextCall.portName || pos.nextCall.portCode}`}
                     sub={`ETA ${fmtDateTime(pos.nextCall.eta)}`} />
              ) : (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> No active voyage on file for this vessel.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StateBadge({ state }: { state?: VesselPosition['state'] }) {
  if (!state || state === 'unknown') return <Badge variant="outline" className="shrink-0">Unknown</Badge>;
  if (state === 'in_port') {
    return <Badge className="bg-emerald-600 text-white border-none shrink-0">In port</Badge>;
  }
  return <Badge className="bg-blue-600 text-white border-none shrink-0">At sea</Badge>;
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground shrink-0 pt-0.5">{label}</span>
      <span className="text-right">
        <span className="font-semibold block">{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </span>
    </div>
  );
}
