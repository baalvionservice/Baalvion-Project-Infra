/**
 * @file logistics-shipment/visibility/[id]/live-map/page.tsx
 * @description Single-shipment position map + checkpoint timeline + latest ETA.
 *
 * Lives under /visibility because it reads tradeops tracking_events, which are keyed by the
 * shipment UUID — the legacy /logistics-shipment/[id] route addresses a different entity
 * (integer-PK trade.shipments), so this page never worked from there.
 *
 * The map plots the most recent tracking_events ping. That ping is only as real as whatever posted
 * it: providers/tracking.js runs a deterministic SIMULATED tracker until TRACKING_API_KEY names a
 * carrier feed, and stamps those events `source: 'simulated'`. So the provenance of the fix is
 * rendered next to it rather than dropped — a dot on a map with no stated source reads as a live
 * GPS position, and here it usually isn't one.
 */
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LiveMap, type MapMarker } from '@/components/logistics/live-map';
import { useShipmentCheckpoints, useLatestEtaPrediction, useLatestTrackingPosition } from '@/api/tracking-platform';
import { PATHS } from '@/lib/paths';

export default function ShipmentLiveMapPage() {
  const params = useParams<{ id: string }>();
  const shipmentId = params.id;
  const { data: position, isLoading: trackingLoading } = useLatestTrackingPosition(shipmentId);
  const { data: checkpoints } = useShipmentCheckpoints(shipmentId);
  const { data: eta } = useLatestEtaPrediction(shipmentId);

  const lastPing = position?.items?.[0];
  const isSimulated = lastPing?.source === 'simulated';
  const markers: MapMarker[] = (lastPing && lastPing.latitude != null && lastPing.longitude != null)
    ? [{ id: shipmentId, latitude: lastPing.latitude, longitude: lastPing.longitude, label: lastPing.locationLabel || 'Last reported position' }]
    : [];

  return (
    <main className="space-y-8 pb-24">
      <div className="border-b pb-8 space-y-3">
        <Link
          href={`${PATHS.SHIPMENT_VISIBILITY}/${shipmentId}`}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="h-3 w-3" /> Shipment
        </Link>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">
          {isSimulated ? 'Simulated Position' : 'Last Reported Position'}
        </p>
        <h2 className="text-3xl font-black tracking-tighter uppercase">Shipment {shipmentId?.slice(0, 8)}</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card className="shadow-none border-2 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-6"><CardTitle className="text-lg font-black uppercase tracking-tighter">Position Map</CardTitle></CardHeader>
            <CardContent className="p-0">
              {trackingLoading ? (
                <div className="flex h-[480px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <LiveMap markers={markers} />
              )}
            </CardContent>
            <div className="border-t p-6 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source of this position</p>
              {!lastPing ? (
                <p className="text-xs text-muted-foreground">
                  No position has been reported for this shipment yet.
                </p>
              ) : isSimulated ? (
                <p className="text-xs text-amber-600 font-medium">
                  Simulated. No carrier or GPS feed is connected, so this point is projected from the
                  shipment&apos;s booking dates rather than observed. Reported {new Date(lastPing.occurredAt).toLocaleString()}.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Reported by <span className="font-bold text-foreground">{lastPing.source}</span> at{' '}
                  {new Date(lastPing.occurredAt).toLocaleString()}
                  {lastPing.locationLabel ? ` — ${lastPing.locationLabel}` : ''}.
                </p>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {eta && (
            <Card className="shadow-none border-2 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wide">ETA Prediction</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground uppercase text-[10px] font-black">Confidence</span>
                <Badge variant="outline" className="font-black">{eta.confidencePct}%</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground uppercase text-[10px] font-black">Risk Score</span>
                <Badge variant="outline" className="font-black">{eta.riskScore}</Badge>
              </div>
            </Card>
          )}

          <Card className="shadow-none border-2 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-6"><CardTitle className="text-sm font-black uppercase tracking-tighter">Checkpoints</CardTitle></CardHeader>
            <CardContent className="p-0 divide-y">
              {(checkpoints?.items || []).length === 0 && <p className="p-6 text-center text-xs font-bold uppercase text-muted-foreground">No checkpoints recorded</p>}
              {(checkpoints?.items || []).map((cp) => (
                <div key={cp.id} className="p-4">
                  <p className="text-xs font-black uppercase">{cp.name || cp.checkpointType}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">
                    {cp.arrivedAt ? `Arrived ${new Date(cp.arrivedAt).toLocaleString()}` : 'Pending arrival'}
                    {cp.departedAt ? ` • Departed ${new Date(cp.departedAt).toLocaleString()}` : ''}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
