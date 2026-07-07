/**
 * @file warehouse-management/bins/[binId]/page.tsx
 * @description Bin detail — capacity, compatibility attributes, and its printable QR/barcode label.
 */
'use client';

import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Thermometer, ShieldAlert, Layers } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { useBin, binLabelUrl } from '@/api/warehouse';
import { PATHS } from '@/lib/paths';

export default function BinDetailPage() {
  const params = useParams<{ binId: string }>();
  const { data: bin, isLoading } = useBin(params.binId);

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" /></div>;
  }

  if (!bin) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Bin not found.</div>;
  }

  const weightPct = bin.capacityWeightKg ? Math.min(100, Math.round((bin.usedWeightKg / bin.capacityWeightKg) * 100)) : null;
  const volumePct = bin.capacityVolumeCbm ? Math.min(100, Math.round((bin.usedVolumeCbm / bin.capacityVolumeCbm) * 100)) : null;
  const unitsPct = bin.capacityUnits ? Math.min(100, Math.round((bin.usedUnits / bin.capacityUnits) * 100)) : null;

  return (
    <main className="space-y-8 pb-24 max-w-4xl">
      <div>
        <Link href={PATHS.WAREHOUSE_MANAGEMENT}>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Warehouse Map</Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{bin.binType}</p>
            <h2 className="text-2xl font-black tracking-tighter font-mono">{bin.code || bin.barcode}</h2>
            {bin.path && <p className="text-xs text-muted-foreground font-medium">{bin.path}</p>}
          </div>
          <StatusBadge status={bin.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-2">
          <CardHeader><CardTitle className="text-sm font-black uppercase tracking-wide">Capacity</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {unitsPct != null && (
              <div>
                <div className="flex justify-between text-xs font-bold mb-1"><span>Units</span><span>{bin.usedUnits} / {bin.capacityUnits}</span></div>
                <Progress value={unitsPct} className="h-2" />
              </div>
            )}
            {weightPct != null && (
              <div>
                <div className="flex justify-between text-xs font-bold mb-1"><span>Weight (kg)</span><span>{bin.usedWeightKg} / {bin.capacityWeightKg}</span></div>
                <Progress value={weightPct} className="h-2" />
              </div>
            )}
            {volumePct != null && (
              <div>
                <div className="flex justify-between text-xs font-bold mb-1"><span>Volume (cbm)</span><span>{bin.usedVolumeCbm} / {bin.capacityVolumeCbm}</span></div>
                <Progress value={volumePct} className="h-2" />
              </div>
            )}
            {unitsPct == null && weightPct == null && volumePct == null && (
              <p className="text-xs text-muted-foreground italic">No capacity limits configured for this bin.</p>
            )}
            <div className="flex flex-wrap gap-4 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {bin.temperatureZone && <span className="flex items-center gap-1.5"><Thermometer className="h-3.5 w-3.5" /> {bin.temperatureZone}</span>}
              {bin.hazardClass && <span className="flex items-center gap-1.5 text-orange-600"><ShieldAlert className="h-3.5 w-3.5" /> {bin.hazardClass}</span>}
              {bin.abcClass && <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> ABC-{bin.abcClass}</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2">
          <CardHeader><CardTitle className="text-sm font-black uppercase tracking-wide">Printable Label</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- same-origin SVG endpoint, not an optimizable static asset */}
            <img src={binLabelUrl(bin.id)} alt={`QR label for ${bin.barcode}`} className="h-40 w-40 border-2 rounded-xl p-2 bg-white" />
            <p className="font-mono text-xs text-muted-foreground">{bin.qrPayload}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
