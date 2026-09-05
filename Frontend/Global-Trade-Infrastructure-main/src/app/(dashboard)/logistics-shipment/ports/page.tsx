'use client';

/**
 * @file logistics-shipment/ports/page.tsx
 * @description Global Port Network — browse every gateway in the registry by region
 * and country, and plan the ocean corridor between any two of them before booking.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Anchor, ArrowRight, Globe2, Loader2, Repeat, Search, Ship, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PortPicker, portKindIcon } from '@/components/logistics/port-picker';
import { CorridorSummary } from '@/components/logistics/corridor-summary';
import { cn } from '@/lib/utils';
import {
  getPortNetwork,
  getVesselClasses,
  isRoutable,
  isSeaport,
  matchesQuery,
  planCorridor,
  type Corridor,
  type NetworkPort,
  type VesselClassOption,
} from '@/services/port-network-service';

const ALL = 'ALL';
const SPEEDS = [14, 16.5, 18, 20];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border-2 bg-background p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums tracking-tighter">{value}</p>
    </div>
  );
}

export default function PortNetworkPage() {
  const router = useRouter();
  const [ports, setPorts] = useState<NetworkPort[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [region, setRegion] = useState(ALL);
  const [country, setCountry] = useState(ALL);
  const [kind, setKind] = useState(ALL);

  const [origin, setOrigin] = useState<NetworkPort | null>(null);
  const [destination, setDestination] = useState<NetworkPort | null>(null);
  const [speed, setSpeed] = useState(16.5);
  const [vesselClasses, setVesselClasses] = useState<VesselClassOption[]>([]);
  const [vesselClassId, setVesselClassId] = useState('NEOPANAMAX');
  const [corridor, setCorridor] = useState<Corridor | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    getPortNetwork()
      .then(setPorts)
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
    getVesselClasses().then(setVesselClasses).catch(() => setVesselClasses([]));
  }, []);

  // Re-plan whenever either end or the assumed speed changes.
  useEffect(() => {
    if (!origin || !destination) {
      setCorridor(null);
      setPlanError(null);
      return;
    }
    let cancelled = false;
    setPlanning(true);
    setPlanError(null);
    planCorridor(origin.code, destination.code, { serviceSpeedKnots: speed, vesselClassId })
      .then((result) => {
        if (!cancelled) setCorridor(result);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setCorridor(null);
          setPlanError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setPlanning(false);
      });
    return () => {
      cancelled = true;
    };
  }, [origin, destination, speed, vesselClassId]);

  const routablePorts = useMemo(() => ports.filter(isRoutable), [ports]);
  const seaports = useMemo(() => ports.filter(isSeaport), [ports]);
  const regions = useMemo(() => [...new Set(ports.map((p) => p.region))].sort(), [ports]);
  const kinds = useMemo(() => [...new Set(ports.map((p) => p.kind).filter(Boolean) as string[])].sort(), [ports]);
  const countries = useMemo(
    () =>
      [...new Map(ports.filter((p) => region === ALL || p.region === region).map((p) => [p.countryCode, p])).values()].sort((a, b) =>
        a.countryName.localeCompare(b.countryName),
      ),
    [ports, region],
  );

  const filtered = useMemo(
    () =>
      ports.filter(
        (p) =>
          (region === ALL || p.region === region) &&
          (country === ALL || p.countryCode === country) &&
          (kind === ALL || p.kind === kind) &&
          matchesQuery(p, query),
      ),
    [ports, region, country, kind, query],
  );

  const bookCorridor = () => {
    if (!origin || !destination) return;
    router.push(`/logistics-shipment/booking?origin=${origin.code}&destination=${destination.code}`);
  };

  return (
    <main className="flex-1 space-y-8 bg-muted/20 p-4 md:p-6">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Global port registry</p>
        </div>
        <h1 className="text-4xl font-black uppercase leading-none tracking-tighter">Port Network.</h1>
        <p className="max-w-3xl text-lg font-medium text-muted-foreground">
          Every seaport, airport, dry port and rail terminal on the platform, grouped by region and country — and the ocean
          corridor between any two of them.
        </p>
      </header>

      {loadError ? (
        <Card className="border-2 border-destructive/40">
          <CardContent className="flex items-center gap-4 p-6">
            <TriangleAlert className="h-6 w-6 shrink-0 text-destructive" />
            <div>
              <p className="font-black uppercase tracking-tight">Port registry unavailable</p>
              <p className="text-sm text-muted-foreground">{loadError}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Points of entry" value={loading ? '—' : ports.length} />
            <Stat label="Seaports" value={loading ? '—' : seaports.length} />
            <Stat label="Countries" value={loading ? '—' : new Set(ports.map((p) => p.countryCode)).size} />
            <Stat label="Regions" value={loading ? '—' : regions.length} />
          </div>

          <Tabs defaultValue="corridor" className="space-y-6">
            <TabsList className="h-12">
              <TabsTrigger value="corridor" className="gap-2 font-black uppercase tracking-widest text-[11px]">
                <Ship className="h-4 w-4" /> Corridor planner
              </TabsTrigger>
              <TabsTrigger value="directory" className="gap-2 font-black uppercase tracking-widest text-[11px]">
                <Globe2 className="h-4 w-4" /> Directory
              </TabsTrigger>
            </TabsList>

            <TabsContent value="corridor" className="space-y-6">
              <Card className="rounded-2xl border-2">
                <CardHeader className="border-b bg-muted/10">
                  <CardTitle className="text-lg font-black uppercase tracking-tighter">Point A to point B</CardTitle>
                  <CardDescription className="font-medium">
                    Pick either end: a seaport, or an inland terminal with a rail or barge gateway to one. Airports and land
                    crossings appear in the directory but cannot anchor an ocean corridor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid items-end gap-4 lg:grid-cols-[1fr_auto_1fr]">
                    <PortPicker
                      label="Origin — port of loading"
                      ports={routablePorts}
                      loading={loading}
                      value={origin}
                      onChange={setOrigin}
                      excludeCode={destination?.code}
                      placeholder="Select the loading port"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Swap origin and destination"
                      disabled={!origin || !destination}
                      onClick={() => {
                        setOrigin(destination);
                        setDestination(origin);
                      }}
                      className="mb-0 h-16 w-16 shrink-0 rounded-2xl border-2"
                    >
                      <Repeat className="h-5 w-5" />
                    </Button>
                    <PortPicker
                      label="Destination — port of discharge"
                      ports={routablePorts}
                      loading={loading}
                      value={destination}
                      onChange={setDestination}
                      excludeCode={origin?.code}
                      placeholder="Select the discharge port"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 border-t pt-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service speed</span>
                    <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
                      <SelectTrigger className="h-10 w-40 rounded-xl border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPEEDS.map((s) => (
                          <SelectItem key={s} value={String(s)}>
                            {s} knots
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vessel</span>
                    <Select value={vesselClassId} onValueChange={setVesselClassId}>
                      <SelectTrigger className="h-10 w-56 rounded-xl border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {vesselClasses.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.label} · {v.nominalTeu.toLocaleString()} TEU
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {corridor && (
                      <Button onClick={bookCorridor} className="ml-auto h-12 gap-2 px-6 text-[11px] font-black uppercase tracking-widest">
                        Book this corridor <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {planning && (
                <div className="flex items-center gap-3 rounded-2xl border-2 p-6 text-sm font-bold text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Routing the corridor…
                </div>
              )}

              {planError && !planning && (
                <Card className="border-2 border-destructive/40">
                  <CardContent className="flex items-center gap-4 p-6">
                    <TriangleAlert className="h-6 w-6 shrink-0 text-destructive" />
                    <p className="text-sm font-bold">{planError}</p>
                  </CardContent>
                </Card>
              )}

              {corridor && !planning && (
                <Card className="rounded-2xl border-2">
                  <CardContent className="p-6">
                    <CorridorSummary corridor={corridor} />
                  </CardContent>
                </Card>
              )}

              {!corridor && !planning && !planError && (
                <div className="rounded-2xl border-2 border-dashed p-12 text-center">
                  <Anchor className="mx-auto h-8 w-8 text-muted-foreground opacity-40" />
                  <p className="mt-4 text-sm font-bold text-muted-foreground">
                    Select both ends of the corridor to see distance, transits and transit time.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="directory" className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative w-full lg:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search port, UN/LOCODE, IATA, country…"
                    className="h-11 rounded-xl border-2 pl-9 font-medium"
                  />
                </div>
                <Select
                  value={region}
                  onValueChange={(v) => {
                    setRegion(v);
                    setCountry(ALL);
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-2 font-bold lg:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All regions</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-2 font-bold lg:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All countries</SelectItem>
                    {countries.map((c) => (
                      <SelectItem key={c.countryCode} value={c.countryCode}>
                        {c.flagEmoji ? `${c.flagEmoji} ` : ''}
                        {c.countryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-2 font-bold lg:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All types</SelectItem>
                    {kinds.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground lg:ml-auto">
                  {loading ? 'Loading…' : `${filtered.length} of ${ports.length}`}
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border-2">
                <table className="w-full min-w-[60rem] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <th className="px-4 py-3">Port</th>
                      <th className="px-4 py-3">Country</th>
                      <th className="px-4 py-3">Region</th>
                      <th className="px-4 py-3">Codes</th>
                      <th className="px-4 py-3">Max draft</th>
                      <th className="px-4 py-3">Position</th>
                      <th className="px-4 py-3 text-right">Corridor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((port) => {
                      const Icon = portKindIcon(port.kind);
                      return (
                        <tr key={port.id} className="transition-colors hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 shrink-0 text-primary opacity-60" />
                              <div className="min-w-0">
                                <p className="truncate font-bold">{port.name}</p>
                                {port.capacityNote && <p className="truncate text-[11px] text-muted-foreground">{port.capacityNote}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold">
                            {port.flagEmoji ? `${port.flagEmoji} ` : ''}
                            {port.countryName}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{port.subregion}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                            {[port.unlocode, port.iata && `IATA ${port.iata}`, port.icao && `ICAO ${port.icao}`].filter(Boolean).join(' · ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-[11px] tabular-nums">
                            {port.maxDraftM != null ? (
                              <span className="font-bold">{port.maxDraftM} m</span>
                            ) : (
                              <span className="text-muted-foreground opacity-60">not on file</span>
                            )}
                            {port.railConnected && <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">rail</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] tabular-nums text-muted-foreground">
                            {port.latitude != null && port.longitude != null
                              ? `${port.latitude.toFixed(2)}, ${port.longitude.toFixed(2)}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isRoutable(port) ? (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setOrigin(port)}
                                  disabled={destination?.code === port.code}
                                  className={cn(
                                    'rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-30',
                                    origin?.code === port.code ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/40',
                                  )}
                                >
                                  From
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDestination(port)}
                                  disabled={origin?.code === port.code}
                                  className={cn(
                                    'rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-30',
                                    destination?.code === port.code ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/40',
                                  )}
                                >
                                  To
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                                {port.kind?.replace(/_/g, ' ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!loading && filtered.length === 0 && (
                  <p className="p-12 text-center text-sm font-bold text-muted-foreground">No point of entry matches these filters.</p>
                )}
                {loading && (
                  <p className="flex items-center justify-center gap-2 p-12 text-sm font-bold text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading the port registry…
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </main>
  );
}
