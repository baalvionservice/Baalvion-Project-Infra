'use client';

/**
 * @file booking/booking-wizard.tsx
 * @description Container booking: corridor, cargo, carrier, authorise.
 *
 * Every step is bound to real platform state rather than free text — the corridor
 * comes from the GCKB port registry and the maritime planner, the equipment from
 * the ISO container catalogue, and the prices from the freight marketplace's own
 * quote engine. The booking is committed through that same engine (`POST /freight`,
 * with carrier fallback and idempotency) and only then mirrored into the shipment
 * register the tracking dashboards read.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle, ArrowRight, Box, Check, ChevronLeft, ChevronRight, Info, Loader2, Plus,
  Repeat, ShieldCheck, Ship, Trash2, TriangleAlert, Umbrella,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { PortPicker } from '@/components/logistics/port-picker';
import { CorridorSummary } from '@/components/logistics/corridor-summary';
import {
  getPortNetwork, getVesselClasses, isRoutable, planCorridor,
  type Corridor, type NetworkPort, type VesselClassOption,
} from '@/services/port-network-service';
import { bookingFollowUp, type BookingFollowUp } from '@/services/booking-followup-service';
import {
  CONTAINER_SPECS, INCOTERMS, containerSpec, summariseCargo, toFreightPieces, type ContainerLine,
} from '@/lib/logistics/containers';
import {
  freightBookingApi, type CompareQuotesResult, type FreightBooking, type MarketplaceCarrier, type NormalizedQuote,
} from '@/api/freight-bookings';
import { insuranceService, describeRating, type QuoteResult, type VerificationGate } from '@/services/insurance-service';

const STEPS = ['Corridor', 'Cargo', 'Carrier', 'Authorise'] as const;
const DEFAULT_VESSEL = 'NEOPANAMAX';
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'INR', 'AED', 'SGD', 'JPY'];
const SPEEDS = [14, 16.5, 18, 20];

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

const emptyLine = (): ContainerLine => ({ containerCode: '40HC', quantity: 1, cargoWeightKgPerUnit: 12000 });

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((label, i) => {
        const index = i + 1;
        const done = step > index;
        const current = step === index;
        return (
          <li
            key={label}
            className={cn(
              'flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors',
              current && 'border-primary bg-primary text-primary-foreground',
              done && 'border-primary/40 bg-primary/5 text-primary',
              !current && !done && 'border-border text-muted-foreground',
            )}
          >
            {done ? <Check className="h-3.5 w-3.5" /> : <span className="tabular-nums">{index}</span>}
            {label}
          </li>
        );
      })}
    </ol>
  );
}

export function BookingWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const params = useSearchParams();

  const [step, setStep] = useState(1);
  const [ports, setPorts] = useState<NetworkPort[]>([]);
  const [portsLoading, setPortsLoading] = useState(true);
  const [portsError, setPortsError] = useState<string | null>(null);

  const [origin, setOrigin] = useState<NetworkPort | null>(null);
  const [destination, setDestination] = useState<NetworkPort | null>(null);
  const [speed, setSpeed] = useState(16.5);
  const [vesselClasses, setVesselClasses] = useState<VesselClassOption[]>([]);
  const [vesselClassId, setVesselClassId] = useState(DEFAULT_VESSEL);
  const [corridor, setCorridor] = useState<Corridor | null>(null);
  const [corridorError, setCorridorError] = useState<string | null>(null);
  const [routing, setRouting] = useState(false);

  const [lines, setLines] = useState<ContainerLine[]>([emptyLine()]);
  const [commodity, setCommodity] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [incoterm, setIncoterm] = useState('FOB');
  const [declaredValue, setDeclaredValue] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [readyDate, setReadyDate] = useState('');
  const [openCustoms, setOpenCustoms] = useState(true);

  const [quoting, setQuoting] = useState(false);
  const [quotes, setQuotes] = useState<CompareQuotesResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<MarketplaceCarrier | null>(null);

  const [authorising, setAuthorising] = useState(false);
  const [booked, setBooked] = useState<{ booking: FreightBooking; followUp: BookingFollowUp } | null>(null);

  // Cargo cover, quoted on the corridor actually chosen. Cover is opt-in: the box
  // moves either way, and pre-ticking it would be selling insurance by default.
  const [addInsurance, setAddInsurance] = useState(false);
  const [insuranceQuote, setInsuranceQuote] = useState<QuoteResult | null>(null);
  const [insuranceQuoting, setInsuranceQuoting] = useState(false);
  const [insuranceError, setInsuranceError] = useState<string | null>(null);

  // Committing a booking demands a verified organization. Asking up front lets the
  // wizard say so on the review step rather than letting the user reach Authorise
  // and meet a 403.
  const [gate, setGate] = useState<VerificationGate | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const routablePorts = useMemo(() => ports.filter(isRoutable), [ports]);
  const equipmentCodes = useMemo(
    () => [...new Set(lines.filter((l) => l.quantity > 0).map((l) => l.containerCode))],
    [lines],
  );
  const cargo = useMemo(() => summariseCargo(lines), [lines]);
  // The equipment carrying most of the boxes drives the cover's container factor.
  const dominantContainer = useMemo(() => {
    const best = [...lines].filter((l) => l.quantity > 0).sort((a, b) => b.quantity - a.quantity)[0];
    return (best?.containerCode || '40HC').toLowerCase();
  }, [lines]);
  const selectedQuote = useMemo(
    () => quotes?.quotes.find((q) => q.carrier === selectedCarrier) ?? null,
    [quotes, selectedCarrier],
  );

  useEffect(() => {
    getPortNetwork()
      .then(setPorts)
      .catch((err: Error) => setPortsError(err.message))
      .finally(() => setPortsLoading(false));
    insuranceService.gate().then(setGate).catch(() => setGate(null));
  }, []);

  // Arriving from the Port Network page with a corridor already chosen.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || ports.length === 0) return;
    prefilled.current = true;
    const originCode = params.get('origin');
    const destinationCode = params.get('destination');
    if (originCode) setOrigin(ports.find((p) => p.code === originCode) ?? null);
    if (destinationCode) setDestination(ports.find((p) => p.code === destinationCode) ?? null);
  }, [ports, params]);

  useEffect(() => {
    if (!origin || !destination) {
      setCorridor(null);
      setCorridorError(null);
      return;
    }
    let cancelled = false;
    setRouting(true);
    setCorridorError(null);
    planCorridor(origin.code, destination.code, { serviceSpeedKnots: speed, vesselClassId, equipment: equipmentCodes })
      .then((result) => !cancelled && setCorridor(result))
      .catch((err: Error) => {
        if (cancelled) return;
        setCorridor(null);
        setCorridorError(err.message);
      })
      .finally(() => !cancelled && setRouting(false));
    return () => {
      cancelled = true;
    };
  }, [origin, destination, speed, vesselClassId, equipmentCodes]);

  // Any change to the corridor or the cargo invalidates prices quoted against them.
  useEffect(() => {
    setQuotes(null);
    setSelectedCarrier(null);
    idempotencyKey.current = null;
  }, [origin, destination, lines, incoterm, declaredValue, currency, readyDate]);

  const buildRequest = useCallback(() => {
    if (!origin || !destination) return null;
    return {
      reference: `${origin.code}-${destination.code}-${Date.now().toString(36).toUpperCase()}`,
      mode: 'ocean',
      incoterm,
      currency,
      declared_value: declaredValue,
      // The UN/LOCODE belongs on the address itself — that is what the booking engine
      // records on the shipment, and what the insurance lane rating is measured on.
      // (Also kept in metadata below for callers that already read it there.)
      origin: { country: origin.countryCode, city: origin.name, unlocode: origin.unlocode ?? origin.code, name: origin.name },
      destination: { country: destination.countryCode, city: destination.name, unlocode: destination.unlocode ?? destination.code, name: destination.name },
      pieces: toFreightPieces(lines),
      ready_date: readyDate || undefined,
      metadata: {
        origin_port: origin.unlocode ?? origin.code,
        destination_port: destination.unlocode ?? destination.code,
        commodity: commodity || undefined,
        hs_code: hsCode || undefined,
        teu: cargo.teu,
        containers: lines.filter((l) => l.quantity > 0).map((l) => ({
          equipment: l.containerCode,
          iso_code: containerSpec(l.containerCode)?.isoCode,
          quantity: l.quantity,
          cargo_weight_kg_per_unit: l.cargoWeightKgPerUnit,
        })),
        corridor: corridor && {
          distance_nm: corridor.route.distanceNm,
          transit_days: corridor.route.transitDays,
          chokepoints: corridor.route.chokepoints.map((c) => c.name),
        },
      },
    };
  }, [origin, destination, incoterm, currency, declaredValue, lines, readyDate, commodity, hsCode, cargo.teu, corridor]);

  const fetchQuotes = useCallback(async () => {
    const request = buildRequest();
    if (!request) return;
    setQuoting(true);
    setQuoteError(null);
    try {
      const result = await freightBookingApi.compareQuotes(request, 'best');
      setQuotes(result);
      setSelectedCarrier((result.best?.carrier as MarketplaceCarrier) ?? null);
      if (result.quotes.length === 0) {
        setQuoteError('No carrier quoted this lane. Adjust the equipment or corridor and try again.');
      }
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : 'The quote engine did not respond.');
    } finally {
      setQuoting(false);
    }
  }, [buildRequest]);

  // Quote the cover once the corridor, the cargo value and the carrier transit are all
  // settled — i.e. on the authorise step, priced on the lane actually being booked.
  useEffect(() => {
    if (step !== 4 || declaredValue <= 0 || !origin || !destination) return;
    let cancelled = false;
    setInsuranceQuoting(true);
    setInsuranceError(null);
    insuranceService
      .quote({
        type: 'cargo',
        coverageAmount: declaredValue,
        currency,
        containerType: dominantContainer,
        originPort: origin.unlocode ?? origin.code,
        destinationPort: destination.unlocode ?? destination.code,
        transitDays: selectedQuote?.transit_days ?? corridor?.route.transitDays,
      })
      .then((q) => { if (!cancelled) setInsuranceQuote(q); })
      .catch((e: Error) => { if (!cancelled) setInsuranceError(e.message); })
      .finally(() => { if (!cancelled) setInsuranceQuoting(false); });
    return () => { cancelled = true; };
  }, [step, declaredValue, currency, dominantContainer, origin, destination, selectedQuote?.transit_days, corridor?.route.transitDays]);

  const goToCarriers = () => {
    setStep(3);
    void fetchQuotes();
  };

  const authorise = async () => {
    const request = buildRequest();
    if (!request || !selectedCarrier || !origin || !destination) return;
    // One key per attempt set: a double submit resolves to the same booking rather
    // than a second one on the same lane.
    idempotencyKey.current ??= globalThis.crypto?.randomUUID?.() ?? `book-${Date.now()}`;

    setAuthorising(true);
    try {
      const booking: FreightBooking = await freightBookingApi.create({
        request,
        preferred_carrier: selectedCarrier,
        idempotency_key: idempotencyKey.current,
      });

      if (booking.status === 'failed' || !booking.tracking_number) {
        toast({
          variant: 'destructive',
          title: 'Carrier did not accept the booking',
          description: booking.last_error ?? 'Every carrier attempt on this lane failed. Try another carrier.',
        });
        return;
      }

      // The freight gateway already materialises the tradeops shipment every other
      // layer references, so there is nothing to mirror here — only the equipment and
      // the declaration that shipment now owes.
      toast({
        title: 'Booking confirmed',
        description: `${booking.carrier?.toUpperCase()} accepted ${cargo.containers} container${cargo.containers === 1 ? '' : 's'} — ${booking.tracking_number}.`,
      });

      const followUp = await bookingFollowUp({
        shipmentId: booking.shipment_id,
        reference: booking.tracking_number,
        carrierId: booking.carrier,
        lines: lines
          .filter((l) => l.quantity > 0)
          .map((l) => ({
            containerCode: l.containerCode,
            isoCode: containerSpec(l.containerCode)?.isoCode,
            quantity: l.quantity,
            cargoWeightKgPerUnit: l.cargoWeightKgPerUnit,
            maxPayloadKg: containerSpec(l.containerCode)?.maxPayloadKg,
          })),
        customs: openCustoms
          ? {
              originCountry: origin.countryCode,
              destinationCountry: destination.countryCode,
              incoterm,
              currency,
              declaredValue,
              hsCode: hsCode || undefined,
              commodity: commodity || undefined,
              containers: cargo.containers,
            }
          : null,
      });

      // Cover is bound against the tradeops shipment the booking engine materialised
      // (booking.shipment_id) — the id every other layer uses. The legacy mirror above
      // has an INTEGER id that the insurance FK cannot accept.
      if (addInsurance && insuranceQuote) {
        try {
          if (!booking.shipment_id) {
            throw new Error('the booking did not produce a shipment record to insure');
          }
          const policy = await insuranceService.createPolicy({
            type: 'cargo',
            shipmentId: booking.shipment_id,
            coverageAmount: insuranceQuote.coverageAmount,
            currency: insuranceQuote.currency,
            containerType: dominantContainer,
          } as never);
          const bound = await insuranceService.bindPolicy(policy.id);
          toast({
            title: `Cargo cover bound — ${bound.policyNumber}`,
            description: `${money(bound.premium, bound.currency)} premium charged against ${money(bound.coverageAmount, bound.currency)} of cover.`,
          });
        } catch (insErr) {
          toast({
            variant: 'destructive',
            title: 'Booking succeeded, cover did NOT bind',
            description: `${insErr instanceof Error ? insErr.message : 'The premium could not be charged.'} The container is booked and uninsured — bind cover from the policy page.`,
          });
        }
      }

      // Stay put and report exactly what now exists. Navigating away here would hide
      // a container or declaration that silently failed to attach.
      setBooked({ booking, followUp });
      setStep(5);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Booking failed',
        description: err instanceof Error ? err.message : 'The booking engine rejected the request.',
      });
    } finally {
      setAuthorising(false);
    }
  };

  const updateLine = (index: number, patch: Partial<ContainerLine>) =>
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const cargoReady = cargo.containers > 0 && cargo.overloaded.length === 0 && declaredValue > 0;
  const blockers = (corridor?.feasibility.findings ?? []).filter((f) => f.severity === 'BLOCKER');
  const corridorReady = Boolean(corridor) && blockers.length === 0;

  return (
    <main className="flex-1 space-y-8 bg-muted/20 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Ocean freight</p>
          </div>
          <h1 className="text-4xl font-black uppercase leading-none tracking-tighter">Book a container.</h1>
          <p className="text-lg font-medium text-muted-foreground">
            Pick the corridor, configure the equipment, compare live carrier quotes and authorise the booking.
          </p>
        </header>

        <Stepper step={step} />

        {portsError && (
          <Card className="border-2 border-destructive/40">
            <CardContent className="flex items-center gap-4 p-6">
              <TriangleAlert className="h-6 w-6 shrink-0 text-destructive" />
              <div>
                <p className="font-black uppercase tracking-tight">Port registry unavailable</p>
                <p className="text-sm text-muted-foreground">{portsError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 1. Corridor ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <Card className="rounded-2xl border-2">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-lg font-black uppercase tracking-tighter">1. Corridor</CardTitle>
              <CardDescription className="font-medium">
                Port of loading and port of discharge, from the global registry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid items-end gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <PortPicker
                  label="Port of loading"
                  ports={routablePorts}
                  loading={portsLoading}
                  value={origin}
                  onChange={setOrigin}
                  excludeCode={destination?.code}
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
                  className="h-16 w-16 shrink-0 rounded-2xl border-2"
                >
                  <Repeat className="h-5 w-5" />
                </Button>
                <PortPicker
                  label="Port of discharge"
                  ports={routablePorts}
                  loading={portsLoading}
                  value={destination}
                  onChange={setDestination}
                  excludeCode={origin?.code}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vessel</span>
                <Select value={vesselClassId} onValueChange={setVesselClassId}>
                  <SelectTrigger className="h-10 w-60 rounded-xl border-2 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vesselClasses.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.label} · {v.nominalTeu.toLocaleString()} TEU · {v.draftM} m
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service speed</span>
                <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
                  <SelectTrigger className="h-10 w-36 rounded-xl border-2 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPEEDS.map((s) => (
                      <SelectItem key={s} value={String(s)}>{s} knots</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {routing && (
                <p className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Routing the corridor…
                </p>
              )}
              {corridorError && !routing && (
                <p className="flex items-start gap-2 rounded-2xl border-2 border-destructive/40 p-4 text-sm font-bold">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> {corridorError}
                </p>
              )}
              {corridor && !routing && (
                <div className="rounded-2xl border-2 bg-background p-6">
                  <CorridorSummary corridor={corridor} compact />
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end border-t bg-muted/10 p-6">
              <div className="flex items-center gap-4">
                {corridor && blockers.length > 0 && (
                  <p className="max-w-md text-right text-[11px] font-bold text-destructive">
                    This corridor is closed to a {corridor.feasibility.vessel.label}. Choose a smaller vessel class or a different
                    port before booking.
                  </p>
                )}
                <Button
                  onClick={() => setStep(2)}
                  disabled={!corridorReady}
                  className="h-12 gap-2 px-6 text-[11px] font-black uppercase tracking-widest"
                >
                  Configure cargo <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* ── 2. Cargo ────────────────────────────────────────────────────── */}
        {step === 2 && (
          <Card className="rounded-2xl border-2">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-lg font-black uppercase tracking-tighter">2. Cargo and equipment</CardTitle>
              <CardDescription className="font-medium">
                Container types, counts and cargo weight. Payload limits are enforced per equipment type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-3">
                {lines.map((line, index) => {
                  const spec = containerSpec(line.containerCode);
                  const over = spec && line.cargoWeightKgPerUnit > spec.maxPayloadKg;
                  return (
                    <div key={index} className="grid gap-3 rounded-2xl border-2 p-4 md:grid-cols-[2fr_1fr_1.4fr_auto]">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Equipment</Label>
                        <Select value={line.containerCode} onValueChange={(v) => updateLine(index, { containerCode: v })}>
                          <SelectTrigger className="h-11 rounded-xl border-2 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTAINER_SPECS.map((s) => (
                              <SelectItem key={s.code} value={s.code}>
                                {s.label} · {s.isoCode}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {spec && (
                          <p className="text-[11px] font-medium text-muted-foreground">
                            {spec.capacityCbm} cbm · payload {spec.maxPayloadKg.toLocaleString()} kg · {spec.teu} TEU
                            {spec.refrigerated ? ' · reefer plug required' : ''}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Units</Label>
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLine(index, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                          className="h-11 rounded-xl border-2 font-bold tabular-nums"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargo weight per unit (kg)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={line.cargoWeightKgPerUnit}
                          onChange={(e) => updateLine(index, { cargoWeightKgPerUnit: Math.max(0, Number(e.target.value) || 0) })}
                          className={cn('h-11 rounded-xl border-2 font-bold tabular-nums', over && 'border-destructive')}
                        />
                        {over && spec && (
                          <p className="text-[11px] font-bold text-destructive">
                            Exceeds the {spec.maxPayloadKg.toLocaleString()} kg payload limit.
                          </p>
                        )}
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={lines.length === 1}
                          onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                          className="h-11 w-11"
                          title="Remove this line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <Button type="button" variant="outline" onClick={() => setLines((c) => [...c, emptyLine()])} className="gap-2 rounded-xl border-2 text-[11px] font-black uppercase tracking-widest">
                  <Plus className="h-4 w-4" /> Add equipment line
                </Button>
              </div>

              <div className="grid gap-4 rounded-2xl border-2 bg-muted/20 p-4 sm:grid-cols-4">
                {[
                  ['Containers', cargo.containers.toString()],
                  ['TEU', cargo.teu.toString()],
                  ['Gross weight', `${cargo.grossWeightKg.toLocaleString()} kg`],
                  ['Capacity', `${cargo.capacityCbm.toLocaleString()} cbm`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="text-xl font-black tabular-nums tracking-tighter">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Commodity</Label>
                  <Input value={commodity} onChange={(e) => setCommodity(e.target.value)} placeholder="e.g. Cotton yarn, ring spun" className="h-11 rounded-xl border-2 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">HS code (optional)</Label>
                  <Input value={hsCode} onChange={(e) => setHsCode(e.target.value)} placeholder="5205.12" className="h-11 rounded-xl border-2 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Incoterm 2020</Label>
                  <Select value={incoterm} onValueChange={setIncoterm}>
                    <SelectTrigger className="h-11 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INCOTERMS.map((t) => <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargo ready date</Label>
                  <Input type="date" value={readyDate} onChange={(e) => setReadyDate(e.target.value)} className="h-11 rounded-xl border-2 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Declared value (required)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={declaredValue || ''}
                    onChange={(e) => setDeclaredValue(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0"
                    className={cn('h-11 rounded-xl border-2 font-bold tabular-nums', !declaredValue && 'border-amber-500/60')}
                  />
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Ocean carriers require a commercial value for customs and will not quote without one.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-11 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t bg-muted/10 p-6">
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-2 text-[11px] font-black uppercase tracking-widest">
                <ChevronLeft className="h-4 w-4" /> Corridor
              </Button>
              <Button onClick={goToCarriers} disabled={!cargoReady} className="h-12 gap-2 px-6 text-[11px] font-black uppercase tracking-widest">
                Compare carriers <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ── 3. Carrier ──────────────────────────────────────────────────── */}
        {step === 3 && (
          <Card className="rounded-2xl border-2">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-lg font-black uppercase tracking-tighter">3. Carrier</CardTitle>
              <CardDescription className="font-medium">
                Quotes from every carrier eligible for this lane, ranked on price, speed and reliability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {/* These prices come from the marketplace's own engine. Until a carrier
                  account is configured that engine simulates the carrier response, and
                  a figure shown as a price must say so. */}
              <div className="flex gap-3 rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
                  <span className="font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Indicative pricing.</span>{' '}
                  No live carrier account is configured on this environment, so a carrier that quotes here returns a modelled
                  rate rather than a contracted one — treat it as a planning figure. A carrier that is onboarded but has neither
                  credentials nor a rate card declines below instead of showing a made-up price; it will quote as soon as its
                  API keys are set.
                </p>
              </div>

              {quoting && (
                <p className="flex items-center gap-2 py-8 text-sm font-bold text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Requesting quotes from the marketplace…
                </p>
              )}

              {quoteError && !quoting && (
                <div className="flex items-start gap-3 rounded-2xl border-2 border-destructive/40 p-4">
                  <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <div className="space-y-2">
                    <p className="text-sm font-bold">{quoteError}</p>
                    <Button variant="outline" size="sm" onClick={() => void fetchQuotes()} className="text-[11px] font-black uppercase tracking-widest">
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {quotes?.quotes.map((quote: NormalizedQuote) => {
                const active = selectedCarrier === quote.carrier;
                const tags = [
                  quotes.cheapest?.carrier === quote.carrier && 'Cheapest',
                  quotes.fastest?.carrier === quote.carrier && 'Fastest',
                  quotes.best?.carrier === quote.carrier && 'Best overall',
                ].filter(Boolean) as string[];

                return (
                  <button
                    key={`${quote.carrier}-${quote.service_level}`}
                    type="button"
                    onClick={() => setSelectedCarrier(quote.carrier as MarketplaceCarrier)}
                    className={cn(
                      'flex w-full flex-col gap-4 rounded-2xl border-2 p-5 text-left transition-all md:flex-row md:items-center md:justify-between',
                      active ? 'border-primary bg-primary/5' : 'hover:border-primary/40',
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-black uppercase tracking-tighter">{quote.carrier}</span>
                        {tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="border-2 text-[9px] font-black uppercase tracking-widest">{tag}</Badge>
                        ))}
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        {quote.service_level ?? quote.mode} · {quote.transit_days} days
                        {quote.reliability != null ? ` · ${quote.reliability}% on-time` : ''}
                        {` · chargeable ${quote.chargeable_weight.toLocaleString()} kg`}
                      </p>
                      {quote.surcharges.length > 0 && (
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Includes {quote.surcharges.map((s) => `${s.label} ${money(s.amount, quote.currency)}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black tabular-nums tracking-tighter">{money(quote.amount, quote.currency)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">All-in, {quote.currency}</p>
                    </div>
                  </button>
                );
              })}

              {quotes && quotes.errors.length > 0 && (
                <ul className="space-y-1.5">
                  {quotes.errors.map((failure) => (
                    <li key={`${failure.carrier}-${failure.code}`} className="flex items-start gap-2 text-[11px] font-medium text-muted-foreground">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        <span className="font-black uppercase tracking-widest">{failure.carrier}</span> declined:{' '}
                        {/* The connector's own reason is the actionable one; the outer
                            message is only ever "validation failed (n issues)". */}
                        {failure.messages?.length ? failure.messages.map((m) => m.text).join(' ') : failure.message}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            <CardFooter className="justify-between border-t bg-muted/10 p-6">
              <Button variant="ghost" onClick={() => setStep(2)} className="gap-2 text-[11px] font-black uppercase tracking-widest">
                <ChevronLeft className="h-4 w-4" /> Cargo
              </Button>
              <Button onClick={() => setStep(4)} disabled={!selectedQuote} className="h-12 gap-2 px-6 text-[11px] font-black uppercase tracking-widest">
                Review booking <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ── 4. Authorise ────────────────────────────────────────────────── */}
        {step === 4 && corridor && selectedQuote && origin && destination && (
          <Card className="rounded-2xl border-2">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-lg font-black uppercase tracking-tighter">4. Authorise</CardTitle>
              <CardDescription className="font-medium">
                Committing sends the booking to {selectedQuote.carrier.toUpperCase()} and registers the shipment for tracking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4 rounded-2xl border-2 p-5">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Ship className="h-3.5 w-3.5" /> Corridor
                  </p>
                  <p className="text-lg font-black uppercase leading-tight tracking-tight">
                    {origin.name} <ArrowRight className="inline h-4 w-4 text-primary" /> {destination.name}
                  </p>
                  <dl className="space-y-1.5 text-sm">
                    {[
                      ['Routed distance', `${corridor.route.distanceNm.toLocaleString()} nm`],
                      ['Corridor estimate', `${corridor.route.transitDays} days`],
                      ['Carrier transit', `${selectedQuote.transit_days} days`],
                      ['Transits', corridor.route.chokepoints.map((c) => c.name).join(', ') || 'None'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="text-right font-bold">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="space-y-4 rounded-2xl border-2 p-5">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Box className="h-3.5 w-3.5" /> Cargo
                  </p>
                  <p className="text-lg font-black uppercase leading-tight tracking-tight">
                    {cargo.containers} container{cargo.containers === 1 ? '' : 's'} · {cargo.teu} TEU
                  </p>
                  <dl className="space-y-1.5 text-sm">
                    {[
                      ['Equipment', lines.filter((l) => l.quantity > 0).map((l) => `${l.quantity} × ${l.containerCode}`).join(', ')],
                      ['Gross weight', `${cargo.grossWeightKg.toLocaleString()} kg`],
                      ['Incoterm', incoterm],
                      ['Commodity', commodity || 'Not stated'],
                      ['Declared value', declaredValue ? money(declaredValue, currency) : 'Not stated'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="text-right font-bold">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {selectedQuote.carrier.toUpperCase()} · {selectedQuote.service_level ?? selectedQuote.mode}
                  </p>
                  <p className="text-3xl font-black tabular-nums tracking-tighter">{money(selectedQuote.amount, selectedQuote.currency)}</p>
                  {selectedQuote.valid_until && (
                    <p className="text-[11px] font-bold text-muted-foreground">
                      Quote valid until {new Date(selectedQuote.valid_until).toLocaleString()}
                    </p>
                  )}
                </div>
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary">
                  <ShieldCheck className="h-4 w-4" /> Carrier fallback enabled
                </p>
              </div>

              {/* Cargo cover on the lane being booked. Marine cargo cover attaches on
                  departure and runs 60 days past discharge; the freight contract's own
                  liability is limited by package, so it is not the same thing. */}
              <div className="space-y-4 rounded-2xl border-2 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <Umbrella className="h-3.5 w-3.5" /> Cargo insurance
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      Cover for physical loss of or damage to the goods in transit, over and above the carrier&apos;s
                      limited liability.
                    </p>
                  </div>
                  {insuranceQuoting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {declaredValue <= 0 ? (
                  <p className="flex gap-2 text-[11px] font-medium text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Declare the cargo value on the Cargo step to be quoted for cover.
                  </p>
                ) : insuranceError ? (
                  <p className="flex gap-2 text-[11px] font-medium text-destructive">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Could not quote cover: {insuranceError}
                  </p>
                ) : insuranceQuote ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setAddInsurance((v) => !v)}
                      className={cn(
                        'flex w-full items-center justify-between gap-4 rounded-xl border-2 p-4 text-left transition-colors',
                        addInsurance ? 'border-primary bg-primary/5' : 'hover:bg-muted/30',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                          addInsurance ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                        )}>
                          {addInsurance && <Check className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight">
                            Insure {money(insuranceQuote.coverageAmount, insuranceQuote.currency)} of cargo
                          </p>
                          <p className="text-[11px] font-medium text-muted-foreground">
                            {money(insuranceQuote.deductible, insuranceQuote.currency)} deductible per claim
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 text-2xl font-black tabular-nums tracking-tighter">
                        {money(insuranceQuote.premium, insuranceQuote.currency)}
                      </p>
                    </button>

                    {/* Say plainly how much of this price is this lane's own record. */}
                    <p className="flex gap-2 text-[11px] font-medium leading-relaxed text-muted-foreground">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {describeRating(insuranceQuote.risk).sentence}
                      {insuranceQuote.risk.factors.filter((f) => f.name !== 'loss_experience').map((f) => ` ${f.detail} (×${f.factor}).`).join('')}
                    </p>
                  </>
                ) : null}
              </div>

              {gate && !gate.canCommit && (
                <div className="flex gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-amber-900">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-tight">Verification required before booking</p>
                    <p className="text-xs leading-relaxed">
                      This account is verified to <strong>{gate.level}</strong> level; committing a booking needs{' '}
                      <strong>{gate.required}</strong>. Outstanding: {gate.reasons.join('; ')}.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setOpenCustoms((v) => !v)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors',
                  openCustoms ? 'border-primary/40 bg-primary/5' : 'hover:border-primary/30',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                    openCustoms ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                  )}
                >
                  {openCustoms && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="space-y-1">
                  <span className="block text-sm font-black uppercase tracking-tight">Open the import declaration</span>
                  <span className="block text-[11px] font-medium leading-relaxed text-muted-foreground">
                    Creates a draft customs entry for {destination.countryName} against this shipment, with duty and tax
                    estimated from the knowledge base. Nothing is filed with an authority — the draft is yours to complete.
                  </span>
                </span>
              </button>

              <p className="flex gap-2 text-[11px] font-medium leading-relaxed text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                The corridor distance and transit are planner estimates; the carrier&apos;s own transit time and price govern the
                booking. If the preferred carrier rejects the lane, the engine falls back to the next-ranked carrier.
              </p>
            </CardContent>
            <CardFooter className="justify-between border-t bg-muted/10 p-6">
              <Button variant="ghost" onClick={() => setStep(3)} disabled={authorising} className="gap-2 text-[11px] font-black uppercase tracking-widest">
                <ChevronLeft className="h-4 w-4" /> Carrier
              </Button>
              <Button onClick={() => void authorise()} disabled={authorising || (gate ? !gate.canCommit : false)} className="h-14 gap-3 px-10 text-xs font-black uppercase tracking-widest">
                {authorising ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                {/* Only add the two up when they are in the same currency — freight is
                    quoted by the carrier, the premium in the cargo's own currency. */}
                {addInsurance && insuranceQuote
                  ? insuranceQuote.currency === selectedQuote.currency
                    ? `Authorise · ${money(selectedQuote.amount + insuranceQuote.premium, selectedQuote.currency)}`
                    : `Authorise · ${money(selectedQuote.amount, selectedQuote.currency)} + ${money(insuranceQuote.premium, insuranceQuote.currency)}`
                  : 'Authorise booking'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ── 5. Booked ───────────────────────────────────────────────────── */}
        {step === 5 && booked && (
          <Card className="rounded-2xl border-2 border-emerald-500/40">
            <CardHeader className="border-b bg-emerald-500/5">
              <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tighter">
                <Check className="h-5 w-5 text-emerald-500" /> Booked
              </CardTitle>
              <CardDescription className="font-medium">
                {booked.booking.carrier?.toUpperCase()} accepted the booking. Tracking number{' '}
                <span className="font-mono font-bold">{booked.booking.tracking_number}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Carrier', `${booked.booking.carrier?.toUpperCase()} · ${booked.booking.service_level ?? booked.booking.mode}`],
                  ['Rate', booked.booking.amount != null ? money(booked.booking.amount, booked.booking.currency) : 'Not returned'],
                  ['Estimated delivery', booked.booking.estimated_delivery ? new Date(booked.booking.estimated_delivery).toLocaleDateString() : 'Not returned'],
                  ['Shipment record', booked.followUp.shipmentId ?? 'Not created'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border-2 p-4">
                    <dt className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 truncate font-bold" title={String(value)}>{value}</dd>
                  </div>
                ))}
              </dl>

              {/* Each follow-on write reports its own outcome: a booking that succeeded
                  with a failed attachment must not read as a clean result. */}
              <ul className="space-y-2">
                {[
                  { label: 'Equipment', outcome: booked.followUp.containers },
                  { label: 'Customs', outcome: booked.followUp.customs },
                ].map(({ label, outcome }) => (
                  <li
                    key={label}
                    className={cn(
                      'flex gap-3 rounded-2xl border-2 p-4',
                      outcome.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5',
                    )}
                  >
                    {outcome.ok ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    )}
                    <div className="space-y-0.5">
                      <p className="text-xs font-black uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-medium text-muted-foreground">{outcome.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-3 border-t bg-muted/10 p-6">
              <Button
                variant="outline"
                onClick={() => router.push('/logistics-shipment/freight/bookings')}
                className="gap-2 text-[11px] font-black uppercase tracking-widest"
              >
                All bookings
              </Button>
              <div className="flex flex-wrap gap-3">
                {booked.followUp.customs.entryId && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/customs/${booked.followUp.shipmentId}`)}
                    className="gap-2 text-[11px] font-black uppercase tracking-widest"
                  >
                    Customs declaration
                  </Button>
                )}
                <Button
                  onClick={() => router.push('/logistics-shipment/ports')}
                  className="gap-2 text-[11px] font-black uppercase tracking-widest"
                >
                  Book another corridor <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  );
}
