'use client';

/**
 * @file corridor-summary.tsx
 * @description Renders a planned corridor end to end: the land legs either side, the
 * ocean passage, the canals and straits it transits, whether the chosen vessel can
 * actually sail it, the transhipment hubs it passes, and what the routing costs if a
 * canal is unavailable.
 *
 * Every figure here is an estimate from the waypoint planner, and the component says
 * so on screen rather than letting a distance read as a charted one. Anything the
 * registry could not tell us is shown as "not on file" — never silently as a pass.
 */
import { AlertTriangle, ArrowRight, CircleHelp, Clock, Gauge, Route, Ship, TriangleAlert, Train, Truck, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CorridorMap, type CorridorPoint } from './corridor-map';
import type { Corridor, CorridorRoute, FindingSeverity, InlandLegView } from '@/services/port-network-service';

const CHOKEPOINT_TONE: Record<string, string> = {
  CANAL: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  STRAIT: 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  CAPE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

const SEVERITY: Record<FindingSeverity, { tone: string; icon: typeof TriangleAlert; label: string }> = {
  BLOCKER: { tone: 'border-destructive/40 bg-destructive/5 text-destructive', icon: TriangleAlert, label: 'Blocker' },
  WARNING: { tone: 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400', icon: AlertTriangle, label: 'Warning' },
  UNKNOWN: { tone: 'border-border bg-muted/30 text-muted-foreground', icon: CircleHelp, label: 'Not on file' },
};

const INLAND_ICON: Record<string, typeof Train> = { RAIL: Train, BARGE: Waves, ROAD: Truck };

function Metric({ icon: Icon, label, value, sub }: { icon: typeof Route; label: string; value: string; sub?: string }) {
  return (
    <div className="space-y-1 rounded-2xl border-2 bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black tabular-nums tracking-tighter">{value}</p>
      {sub && <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{sub}</p>}
    </div>
  );
}

function InlandLegRow({ leg, role }: { leg: InlandLegView; role: string }) {
  const Icon = INLAND_ICON[leg.mode] ?? Truck;
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-teal-500/30 bg-teal-500/5 p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
      <div className="min-w-0 space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">
          {role} · {leg.mode.toLowerCase()}
        </p>
        <p className="text-sm font-bold">
          {leg.fromName} <ArrowRight className="inline h-3.5 w-3.5" /> {leg.toName}
          <span className="ml-2 font-medium text-muted-foreground tabular-nums">
            {leg.distanceKm.toLocaleString()} km · {leg.days} day{leg.days === 1 ? '' : 's'}
          </span>
        </p>
        <p className="text-[11px] font-medium text-muted-foreground">{leg.note}</p>
      </div>
    </div>
  );
}

function Chokepoints({ route }: { route: CorridorRoute }) {
  if (route.chokepoints.length === 0) {
    return (
      <p className="text-xs font-bold text-muted-foreground">
        {route.direct ? 'Direct coastal run — no canal or strait transit.' : 'Open-water routing — no canal or strait transit.'}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {route.chokepoints.map((point) => (
        <span
          key={point.id}
          title={point.note}
          className={cn('rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest', CHOKEPOINT_TONE[point.kind] ?? 'border-border text-muted-foreground')}
        >
          {point.name}
        </span>
      ))}
    </div>
  );
}

/** The corridor's points in sailing order, tagged so the map can size each marker. */
function mapPoints(corridor: Corridor): CorridorPoint[] {
  const points: CorridorPoint[] = [];
  if (corridor.originLeg) {
    points.push({ name: corridor.origin.name, latitude: corridor.origin.latitude, longitude: corridor.origin.longitude, kind: 'inland' });
  }
  corridor.route.track.forEach((point, i) => {
    const isEnd = i === 0 || i === corridor.route.track.length - 1;
    points.push({ ...point, kind: isEnd ? 'endpoint' : 'waypoint' });
  });
  if (corridor.destinationLeg) {
    points.push({ name: corridor.destination.name, latitude: corridor.destination.latitude, longitude: corridor.destination.longitude, kind: 'inland' });
  }
  return points;
}

interface Props {
  corridor: Corridor;
  /** Hide the leg table and the map when the corridor is a supporting detail. */
  compact?: boolean;
}

export function CorridorSummary({ corridor, compact }: Props) {
  const { route, alternative, feasibility, hubs, total, originLeg, destinationLeg } = corridor;
  const delta = alternative ? alternative.route.distanceNm - route.distanceNm : 0;
  const daysDelta = alternative ? alternative.route.transitDays - route.transitDays : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm font-black uppercase tracking-tight">
        <span>{corridor.origin.name}</span>
        <ArrowRight className="h-4 w-4 text-primary" />
        <span>{corridor.destination.name}</span>
        <span className="font-mono text-[11px] font-bold normal-case tracking-normal text-muted-foreground">
          {corridor.origin.unlocode ?? corridor.origin.code} to {corridor.destination.unlocode ?? corridor.destination.code}
        </span>
        {total.doorToDoor && (
          <span className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Door to door
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={Route}
          label={total.doorToDoor ? 'Total distance' : 'Routed distance'}
          value={total.doorToDoor ? `${total.distanceKm.toLocaleString()} km` : `${route.distanceNm.toLocaleString()} nm`}
          sub={total.doorToDoor ? `${route.distanceNm.toLocaleString()} nm at sea` : `${route.distanceKm.toLocaleString()} km`}
        />
        <Metric icon={Clock} label="Transit estimate" value={`${total.days} days`} sub={total.doorToDoor ? `${route.transitDays} days port to port` : `${route.seaDays} days at sea`} />
        <Metric icon={Gauge} label="Service speed" value={`${route.serviceSpeedKnots} kn`} sub="Assumed" />
        <Metric icon={Ship} label="Legs" value={String(route.legs.length)} sub={`${route.chokepoints.length} chokepoint${route.chokepoints.length === 1 ? '' : 's'}`} />
      </div>

      {(originLeg || destinationLeg) && (
        <div className="space-y-3">
          {originLeg && <InlandLegRow leg={originLeg} role="Pre-carriage" />}
          <div className="flex items-start gap-3 rounded-2xl border-2 p-4">
            <Ship className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Ocean</p>
              <p className="text-sm font-bold">
                {corridor.loadPort.name} <ArrowRight className="inline h-3.5 w-3.5" /> {corridor.dischargePort.name}
                <span className="ml-2 font-medium text-muted-foreground tabular-nums">
                  {route.distanceNm.toLocaleString()} nm · {route.transitDays} days
                </span>
              </p>
            </div>
          </div>
          {destinationLeg && <InlandLegRow leg={destinationLeg} role="On-carriage" />}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transits</p>
        <Chokepoints route={route} />
      </div>

      {/* Vessel and equipment feasibility. */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vessel check</p>
          <p className="text-xs font-bold">
            {feasibility.vessel.label}
            <span className="ml-2 font-medium text-muted-foreground">
              {feasibility.vessel.nominalTeu.toLocaleString()} TEU · {feasibility.vessel.draftM} m draft · {feasibility.vessel.loaM} m LOA
            </span>
          </p>
          <span
            className={cn(
              'rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest',
              feasibility.passable ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-destructive/40 bg-destructive/10 text-destructive',
            )}
          >
            {feasibility.passable ? 'Corridor open' : 'Corridor closed to this vessel'}
          </span>
        </div>

        {[...feasibility.findings, ...feasibility.equipment.map((e) => ({ severity: e.severity, at: e.equipment, title: e.title, detail: e.detail }))].length === 0 ? (
          <p className="text-xs font-bold text-muted-foreground">Nothing on this corridor restricts the vessel or the equipment.</p>
        ) : (
          <ul className="space-y-2">
            {[...feasibility.findings, ...feasibility.equipment.map((e) => ({ severity: e.severity, at: e.equipment, title: e.title, detail: e.detail }))].map((finding) => {
              const tone = SEVERITY[finding.severity];
              const Icon = tone.icon;
              return (
                <li key={`${finding.at}-${finding.title}`} className={cn('flex gap-3 rounded-2xl border-2 p-3', tone.tone)}>
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-widest">{tone.label} · {finding.at}</p>
                    <p className="text-sm font-bold text-foreground">{finding.title}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{finding.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {alternative && (
        <div className="flex gap-4 rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 p-4">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
              If the {alternative.avoided} is unavailable
            </p>
            <p className="text-sm font-bold">
              {alternative.route.distanceNm.toLocaleString()} nm / {alternative.route.transitDays} days
              <span className="ml-2 font-medium text-muted-foreground">
                (+{delta.toLocaleString()} nm, +{daysDelta} days
                {alternative.route.chokepoints.length > 0 ? ` via ${alternative.route.chokepoints.map((c) => c.name).join(', ')}` : ''})
              </span>
            </p>
          </div>
        </div>
      )}

      {hubs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transhipment hubs on this corridor</p>
          <div className="flex flex-wrap gap-2">
            {hubs.map((hub) => (
              <span key={hub.code} className="rounded-lg border-2 px-2.5 py-1 text-[10px] font-bold">
                <span className="font-black uppercase tracking-widest">{hub.code}</span>
                <span className="ml-1.5 text-muted-foreground">{hub.name} · +{hub.detourPercent}%</span>
              </span>
            ))}
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            Long lanes are usually relayed rather than sailed end to end. These hubs sit on the corridor, so they are where a
            relay would happen — check the sailing schedules for an actual service before promising one.
          </p>
        </div>
      )}

      {!compact && (
        <>
          <CorridorMap
            points={mapPoints(corridor)}
            alternative={alternative ? alternative.route.track.map((p) => ({ ...p, kind: 'waypoint' as const })) : undefined}
          />

          <div className="overflow-hidden rounded-2xl border-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-2.5">Leg</th>
                  <th className="px-4 py-2.5">From</th>
                  <th className="px-4 py-2.5">To</th>
                  <th className="px-4 py-2.5 text-right">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {route.legs.map((leg, i) => (
                  <tr key={`${leg.from}-${leg.to}`} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5 font-bold">{leg.from}</td>
                    <td className="px-4 py-2.5 font-bold">{leg.to}</td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums">{leg.nm.toLocaleString()} nm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="flex gap-2 text-[11px] font-medium leading-relaxed text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {corridor.method}
      </p>
    </div>
  );
}
