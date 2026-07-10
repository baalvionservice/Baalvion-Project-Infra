/**
 * @file logistics-shipment/eta/page.tsx
 * @description ETA Prediction Dashboard — look up a shipment's live in-transit ETA, confidence,
 * risk score, and delay probability, with an on-demand recompute action.
 */
'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, Gauge, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLatestEtaPrediction, useRecomputeEta } from '@/api/tracking-platform';

export default function EtaDashboardPage() {
  const [shipmentId, setShipmentId] = useState('');
  const [lookupId, setLookupId] = useState('');
  const { data: prediction, isLoading, isError } = useLatestEtaPrediction(lookupId);
  const recompute = useRecomputeEta(lookupId);

  return (
    <main className="space-y-8 pb-24">
      <div className="border-b pb-8 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Shipment Tracking Platform</p>
        <h2 className="text-4xl font-black tracking-tighter uppercase">ETA Prediction.</h2>
      </div>

      <Card className="shadow-none border-2 rounded-2xl p-6">
        <div className="flex gap-3">
          <Input placeholder="Shipment ID (UUID)" value={shipmentId} onChange={(e) => setShipmentId(e.target.value)} className="flex-1" />
          <Button className="font-black uppercase text-xs" onClick={() => setLookupId(shipmentId)}>Look Up</Button>
        </div>
      </Card>

      {lookupId && (
        <Card className="shadow-none border-2 rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/10 border-b p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-black uppercase tracking-tighter">Prediction</CardTitle>
            <Button size="sm" variant="outline" className="text-[10px] font-black uppercase" disabled={recompute.isPending} onClick={() => recompute.mutate()}>
              <RefreshCw className={`h-3 w-3 mr-2 ${recompute.isPending ? 'animate-spin' : ''}`} /> Recompute
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {isError && !isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
                <AlertTriangle className="h-4 w-4" /> No prediction yet — try Recompute.
              </div>
            )}
            {prediction && (
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Predicted ETA</p>
                  <p className="text-xl font-black">{prediction.predictedEta ? new Date(prediction.predictedEta).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Confidence</p>
                  <p className="text-xl font-black text-emerald-600">{prediction.confidencePct}%</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1"><Gauge className="h-3 w-3" /> Risk Score</p>
                  <p className="text-xl font-black text-orange-600">{prediction.riskScore}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Delay Probability</p>
                  <p className="text-xl font-black text-red-600">{prediction.delayProbabilityPct}%</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
