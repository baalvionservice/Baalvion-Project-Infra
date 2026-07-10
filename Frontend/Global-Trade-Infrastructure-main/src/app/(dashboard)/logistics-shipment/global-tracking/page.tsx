/**
 * @file logistics-shipment/global-tracking/page.tsx
 * @description Global Shipment Tracking Dashboard — the KPI/map/alerts/search command surface for
 * the Shipment Tracking & Global Visibility Platform. Reads live data from trade-service's
 * /tracking_dashboard + /tracking_search endpoints (src/api/tracking-platform.ts).
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck, PackageCheck, Siren, ShieldCheck, Ban, Radio, Clock, Send,
  RotateCcw, Search, Loader2, Activity, Gauge,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PATHS } from '@/lib/paths';
import { LiveMap, type MapMarker } from '@/components/logistics/live-map';
import {
  useTrackingDashboardSummary, useTrackingMapOverview, useTrackingDashboardAlerts, useTrackingSearch,
} from '@/api/tracking-platform';

const STATUS_SEVERITY_COLOR: Record<string, string> = {
  critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#2563eb',
};

export default function GlobalTrackingDashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: summary, isLoading: summaryLoading } = useTrackingDashboardSummary();
  const { data: mapPoints, isLoading: mapLoading } = useTrackingMapOverview();
  const { data: alerts, isLoading: alertsLoading } = useTrackingDashboardAlerts(10);
  const { data: searchResults, isFetching: searching } = useTrackingSearch(searchQuery);

  const kpis = [
    { label: 'Active Shipments', value: summary?.active, icon: Activity, color: 'text-blue-600' },
    { label: 'In Transit', value: summary?.inTransit, icon: Truck, color: 'text-indigo-600' },
    { label: 'Waiting Pickup', value: summary?.waitingPickup, icon: Clock, color: 'text-amber-600' },
    { label: 'Out For Delivery', value: summary?.outForDelivery, icon: Send, color: 'text-cyan-600' },
    { label: 'Delivered', value: summary?.delivered, icon: PackageCheck, color: 'text-emerald-600' },
    { label: 'Delayed', value: summary?.delayed, icon: Siren, color: 'text-orange-600' },
    { label: 'Customs Hold', value: summary?.customsHold, icon: ShieldCheck, color: 'text-red-600' },
    { label: 'Exception', value: summary?.exception, icon: Siren, color: 'text-red-700' },
    { label: 'Cancelled', value: summary?.cancelled, icon: Ban, color: 'text-slate-500' },
    { label: 'Returned', value: summary?.returned, icon: RotateCcw, color: 'text-purple-600' },
  ];

  const markers: MapMarker[] = (mapPoints || []).map((p) => ({
    id: p.shipmentId,
    latitude: p.latitude,
    longitude: p.longitude,
    label: p.shipmentNo,
    status: p.status,
  }));

  return (
    <main className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Global Shipment Tracking</p>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-[0.9]">Tracking &amp; Visibility<br />Dashboard.</h2>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tracking #, shipment, container, PO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-11 rounded-2xl border-2 font-medium"
          />
          {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
          {searchQuery && searchResults && (
            <Card className="absolute z-20 mt-2 w-full border-2 shadow-xl rounded-2xl max-h-80 overflow-auto">
              <CardContent className="p-2">
                {searchResults.shipments.length === 0 && searchResults.containers.length === 0 && (
                  <p className="p-4 text-xs text-muted-foreground uppercase font-bold">No matches</p>
                )}
                {searchResults.shipments.map((s) => (
                  <button
                    key={s.id}
                    className="w-full text-left p-3 rounded-xl hover:bg-muted/40 transition-colors"
                    onClick={() => router.push(`${PATHS.LOGISTICS_SHIPMENT}/${s.id}`)}
                  >
                    <p className="text-sm font-black uppercase">{s.shipment_no}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{s.status} • {s.tracking_number || 'no tracking #'}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-none border-2 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-5 pt-5">
              <CardTitle className="text-[9px] font-black uppercase text-muted-foreground tracking-wide">{kpi.label}</CardTitle>
              <kpi.icon className={cn('h-4 w-4', kpi.color)} />
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="text-3xl font-black tracking-tighter tabular-nums">
                {summaryLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : (kpi.value ?? 0)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-none border-2 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
              <Gauge className="h-4 w-4" /> Avg Transit Time
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-black">{summary?.avgTransitDays ?? '—'} <span className="text-sm font-bold text-muted-foreground">days</span></div></CardContent>
        </Card>
        <Card className="shadow-none border-2 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">ETA Accuracy</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-black">{summary?.etaAccuracyPct ?? '—'}%</div></CardContent>
        </Card>
        <Card className="shadow-none border-2 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Shipment Health</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-black text-emerald-600">{summary?.shipmentHealthPct ?? '—'}%</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card className="shadow-none border-2 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black uppercase tracking-tighter">Map Overview</CardTitle>
              <Badge variant="outline" className="text-[9px] font-black uppercase">{markers.length} live positions</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {mapLoading ? (
                <div className="flex h-[480px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <LiveMap markers={markers} onMarkerClick={(m) => router.push(`${PATHS.LOGISTICS_SHIPMENT}/${m.id}`)} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="shadow-none border-2 rounded-2xl h-full flex flex-col">
            <CardHeader className="bg-muted/10 border-b p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                <Radio className="h-4 w-4 text-red-500" /> Active Alerts
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase" onClick={() => router.push(`${PATHS.LOGISTICS_SHIPMENT}/alerts`)}>
                View all
              </Button>
            </CardHeader>
            <CardContent className="p-0 divide-y flex-1 overflow-auto max-h-[440px]">
              {alertsLoading && <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
              {!alertsLoading && (alerts || []).length === 0 && (
                <p className="p-8 text-center text-xs text-muted-foreground uppercase font-bold">Zero active alerts</p>
              )}
              {(alerts || []).map((alert) => (
                <div key={alert.id} className="p-4 space-y-1 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => router.push(`${PATHS.LOGISTICS_SHIPMENT}/${alert.shipmentId}`)}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_SEVERITY_COLOR[alert.severity] || '#64748b' }} />
                    <span className="text-[10px] font-black uppercase tracking-wide">{alert.alertType.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{alert.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
