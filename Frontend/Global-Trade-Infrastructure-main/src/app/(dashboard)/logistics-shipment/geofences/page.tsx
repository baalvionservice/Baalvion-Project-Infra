/**
 * @file logistics-shipment/geofences/page.tsx
 * @description Geofence management — list active zones + create a new circular fence.
 */
'use client';

import { useState } from 'react';
import { Loader2, Plus, MapPinned } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGeofences, useCreateGeofence } from '@/api/tracking-platform';

const FENCE_TYPES = ['warehouse', 'port', 'airport', 'customer', 'border', 'customs', 'delivery_hub', 'rail_terminal', 'distribution_center', 'other'];

export default function GeofencesPage() {
  const { data, isLoading } = useGeofences();
  const createGeofence = useCreateGeofence();
  const [form, setForm] = useState({ name: '', fenceType: 'warehouse', lat: '', lng: '', radiusM: '1000' });

  const handleCreate = () => {
    if (!form.name || !form.lat || !form.lng) return;
    createGeofence.mutate({
      name: form.name,
      fenceType: form.fenceType,
      shape: { type: 'circle', center: { lat: Number(form.lat), lng: Number(form.lng) }, radius_m: Number(form.radiusM) },
    }, { onSuccess: () => setForm({ name: '', fenceType: 'warehouse', lat: '', lng: '', radiusM: '1000' }) });
  };

  return (
    <main className="space-y-8 pb-24">
      <div className="border-b pb-8 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Shipment Tracking Platform</p>
        <h2 className="text-4xl font-black tracking-tighter uppercase">Geofences.</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card className="shadow-none border-2 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-6"><CardTitle className="text-lg font-black uppercase tracking-tighter">Active Zones</CardTitle></CardHeader>
            <CardContent className="p-0 divide-y">
              {isLoading && <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
              {!isLoading && (data?.items || []).length === 0 && <p className="p-12 text-center text-xs font-bold uppercase text-muted-foreground">No geofences configured yet</p>}
              {(data?.items || []).map((fence) => (
                <div key={fence.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-muted border-2 flex items-center justify-center"><MapPinned className="h-5 w-5 text-primary opacity-70" /></div>
                    <div>
                      <p className="font-black uppercase tracking-tight">{fence.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{fence.fenceType}</p>
                    </div>
                  </div>
                  <Badge variant={fence.active ? 'default' : 'outline'} className="text-[8px] font-black uppercase">{fence.active ? 'active' : 'inactive'}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="shadow-none border-2 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wide">New Geofence</h3>
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.fenceType}
              onChange={(e) => setForm({ ...form, fenceType: e.target.value })}
            >
              {FENCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Latitude" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
              <Input placeholder="Longitude" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
            </div>
            <Input placeholder="Radius (meters)" value={form.radiusM} onChange={(e) => setForm({ ...form, radiusM: e.target.value })} />
            <Button className="w-full font-black uppercase text-xs" disabled={createGeofence.isPending} onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" /> Create Geofence
            </Button>
          </Card>
        </div>
      </div>
    </main>
  );
}
