'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useCarrier, useUpdateCarrier, useDeleteCarrier, useAddCarrierService, useAddCarrierRegion,
  useCarrierPerformanceLatest, TransportMode,
} from '@/api';
import { FreightNavTabs } from '../../../_components/freight-nav-tabs';
import { modeMeta, CARRIER_STATUS_COLORS } from '../../../_components/mode-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALL_MODES: TransportMode[] = ['ocean', 'air', 'rail', 'road', 'express', 'multimodal'];

export default function CarrierDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { data: carrier, isLoading } = useCarrier(params.id);
  const { data: performance } = useCarrierPerformanceLatest(params.id);
  const updateCarrier = useUpdateCarrier();
  const deleteCarrier = useDeleteCarrier();
  const addService = useAddCarrierService();
  const addRegion = useAddCarrierRegion();

  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({ serviceType: '', transportMode: 'ocean' as TransportMode, baseFee: '', ratePerKg: '', transitTimeDays: '' });
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionForm, setRegionForm] = useState({ regionType: 'country', originCode: '', destinationCode: '' });

  if (isLoading) return <main className="p-6"><p className="text-sm text-muted-foreground">Loading carrier…</p></main>;
  if (!carrier) return <main className="p-6"><p className="text-sm text-muted-foreground">Carrier not found.</p></main>;

  const toggleStatus = async () => {
    const next = carrier.status === 'active' ? 'suspended' : 'active';
    await updateCarrier.mutateAsync({ id: carrier.id, body: { status: next } });
    toast({ title: `Carrier ${next}` });
  };

  const handleDelete = async () => {
    await deleteCarrier.mutateAsync(carrier.id);
    toast({ title: 'Carrier removed' });
    router.push('/logistics-shipment/freight/carriers/manage');
  };

  const handleAddService = async () => {
    await addService.mutateAsync({
      id: carrier.id,
      body: {
        serviceType: serviceForm.serviceType,
        transportMode: serviceForm.transportMode,
        baseFee: Number(serviceForm.baseFee) || undefined,
        ratePerKg: Number(serviceForm.ratePerKg) || undefined,
        transitTimeDays: Number(serviceForm.transitTimeDays) || undefined,
      },
    });
    setServiceOpen(false);
    setServiceForm({ serviceType: '', transportMode: 'ocean', baseFee: '', ratePerKg: '', transitTimeDays: '' });
    toast({ title: 'Service added' });
  };

  const handleAddRegion = async () => {
    await addRegion.mutateAsync({ id: carrier.id, body: { regionType: regionForm.regionType, originCode: regionForm.originCode || undefined, destinationCode: regionForm.destinationCode || undefined } });
    setRegionOpen(false);
    setRegionForm({ regionType: 'country', originCode: '', destinationCode: '' });
    toast({ title: 'Coverage region added' });
  };

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/logistics-shipment/freight/carriers/manage')}><ChevronLeft className="h-4 w-4 mr-1" /> All Carriers</Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{carrier.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{carrier.code} {carrier.connectorKey ? `· ${carrier.connectorKey} integration` : '· manual / generic connector'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('capitalize', CARRIER_STATUS_COLORS[carrier.status])}>{carrier.status}</Badge>
          <Button variant="outline" size="sm" onClick={toggleStatus}>{carrier.status === 'active' ? 'Suspend' : 'Activate'}</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <FreightNavTabs />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-none border"><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Rating</p><p className="text-xl font-bold">{carrier.rating != null ? carrier.rating.toFixed(1) : '—'}</p></CardContent></Card>
        <Card className="shadow-none border"><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Reliability</p><p className="text-xl font-bold">{carrier.reliabilityScore}%</p></CardContent></Card>
        <Card className="shadow-none border"><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Performance Score</p><p className="text-xl font-bold">{carrier.performanceScore != null ? carrier.performanceScore.toFixed(0) : '—'}</p></CardContent></Card>
        <Card className="shadow-none border"><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">On-Time %</p><p className="text-xl font-bold">{performance?.onTimePct != null ? `${performance.onTimePct.toFixed(0)}%` : 'No data yet'}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Service Offerings</CardTitle>
          <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" /> Add Service</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Service Offering</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2"><Label>Service Type</Label><Input value={serviceForm.serviceType} onChange={(e) => setServiceForm((f) => ({ ...f, serviceType: e.target.value }))} placeholder="FCL, LCL, Express…" /></div>
                <div className="space-y-2">
                  <Label>Transport Mode</Label>
                  <Select value={serviceForm.transportMode} onValueChange={(v) => setServiceForm((f) => ({ ...f, transportMode: v as TransportMode }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ALL_MODES.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2"><Label>Base Fee</Label><Input type="number" value={serviceForm.baseFee} onChange={(e) => setServiceForm((f) => ({ ...f, baseFee: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Rate/kg</Label><Input type="number" value={serviceForm.ratePerKg} onChange={(e) => setServiceForm((f) => ({ ...f, ratePerKg: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Transit Days</Label><Input type="number" value={serviceForm.transitTimeDays} onChange={(e) => setServiceForm((f) => ({ ...f, transitTimeDays: e.target.value }))} /></div>
                </div>
              </div>
              <DialogFooter><Button onClick={handleAddService} disabled={!serviceForm.serviceType}>Add Service</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {carrier.carrierServices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No service offerings configured yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {carrier.carrierServices.map((s) => {
                const meta = modeMeta(s.transportMode);
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <meta.icon className={cn('h-4 w-4', meta.color)} />
                      <div><p className="text-xs font-bold">{s.serviceType}</p><p className="text-[10px] text-muted-foreground">{s.transitTimeDays ?? '—'}d transit</p></div>
                    </div>
                    <p className="text-xs font-mono">{s.baseFee ?? 0} + {s.ratePerKg ?? 0}/kg</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Coverage Regions</CardTitle>
          <Dialog open={regionOpen} onOpenChange={setRegionOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" /> Add Region</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Coverage Region</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Region Type</Label>
                  <Select value={regionForm.regionType} onValueChange={(v) => setRegionForm((f) => ({ ...f, regionType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="country">Country</SelectItem>
                      <SelectItem value="lane">Lane</SelectItem>
                      <SelectItem value="port_pair">Port Pair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Origin Code</Label><Input value={regionForm.originCode} onChange={(e) => setRegionForm((f) => ({ ...f, originCode: e.target.value.toUpperCase() }))} /></div>
                  <div className="space-y-2"><Label>Destination Code</Label><Input value={regionForm.destinationCode} onChange={(e) => setRegionForm((f) => ({ ...f, destinationCode: e.target.value.toUpperCase() }))} /></div>
                </div>
              </div>
              <DialogFooter><Button onClick={handleAddRegion}>Add Region</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {carrier.carrierRegions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No coverage regions configured yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {carrier.carrierRegions.map((r) => (
                <Badge key={r.id} variant="outline" className="text-[10px]">{r.regionType}: {r.originCode ?? '*'} → {r.destinationCode ?? '*'}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Support & Compliance</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground text-xs">Support Contact</span><p className="font-bold">{carrier.supportContact?.email ?? '—'}</p></div>
          <div><span className="text-muted-foreground text-xs">Insurance Coverage</span><p className="font-bold">{carrier.insurance?.coverage_amount ? `${carrier.insurance.currency ?? 'USD'} ${carrier.insurance.coverage_amount.toLocaleString()}` : 'Not on file'}</p></div>
          <div><span className="text-muted-foreground text-xs">Certifications</span><p className="font-bold">{carrier.certifications?.length ? carrier.certifications.join(', ') : '—'}</p></div>
          <div className="flex items-center gap-2"><Switch checked={carrier.trackingApiSupported} disabled /><Label>Live Tracking API</Label></div>
          <div className="flex items-center gap-2"><Switch checked={carrier.bookingApiSupported} disabled /><Label>Live Booking API</Label></div>
          <div className="flex items-center gap-2"><Switch checked={carrier.pricingApiSupported} disabled /><Label>Live Pricing API</Label></div>
        </CardContent>
      </Card>
    </main>
  );
}
