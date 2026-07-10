/**
 * @file logistics-shipment/analytics/page.tsx
 * @description Tracking Analytics — carrier performance ranking + open delay causes.
 */
'use client';

import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useDelayEvents } from '@/api/tracking-platform';
import { useQuery } from '@tanstack/react-query';
import { trackingPlatformApi } from '@/api/tracking-platform';
import { qk } from '@/api/keys';

function useCarrierPerformance() {
  return useQuery({ queryKey: qk.trackingPlatform.dashboardCarrierPerformance, queryFn: trackingPlatformApi.dashboardCarrierPerformance });
}

export default function TrackingAnalyticsPage() {
  const { data: carriers, isLoading: carriersLoading } = useCarrierPerformance();
  const { data: delays, isLoading: delaysLoading } = useDelayEvents({ resolved: false });

  return (
    <main className="space-y-8 pb-24">
      <div className="border-b pb-8 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Shipment Tracking Platform</p>
        <h2 className="text-4xl font-black tracking-tighter uppercase">Tracking Analytics.</h2>
      </div>

      <Card className="shadow-none border-2 rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/10 border-b p-6"><CardTitle className="text-lg font-black uppercase tracking-tighter">Carrier Performance</CardTitle></CardHeader>
        <CardContent className="p-0">
          {carriersLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead>On-Time %</TableHead>
                  <TableHead>Avg Transit Days</TableHead>
                  <TableHead>ETA Accuracy</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {((carriers as any[]) || []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-black uppercase text-xs">{c.carrier?.name || c.carrier_id}</TableCell>
                    <TableCell>{c.on_time_pct ?? '—'}%</TableCell>
                    <TableCell>{c.avg_transit_days ?? '—'}</TableCell>
                    <TableCell>{c.eta_accuracy_pct ?? '—'}%</TableCell>
                    <TableCell><Badge variant="outline" className="font-black">{c.computed_score ?? '—'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none border-2 rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/10 border-b p-6"><CardTitle className="text-lg font-black uppercase tracking-tighter">Open Delay Causes</CardTitle></CardHeader>
        <CardContent className="p-0 divide-y">
          {delaysLoading && <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {!delaysLoading && (delays?.items || []).length === 0 && <p className="p-12 text-center text-xs font-bold uppercase text-muted-foreground">No open delays</p>}
          {(delays?.items || []).map((d) => (
            <div key={d.id} className="p-5 flex items-center justify-between">
              <div>
                <p className="font-black uppercase tracking-tight text-sm">{d.delayType.replace(/_/g, ' ')}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Shipment {d.shipmentId.slice(0, 8)} • {new Date(d.detectedAt).toLocaleString()}</p>
              </div>
              {d.estimatedDelayMinutes != null && <Badge variant="outline" className="font-black">{Math.round(d.estimatedDelayMinutes / 60)}h</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
