/**
 * @file warehouse-management/putaway/[taskId]/page.tsx
 * @description Single putaway task — shows the engine's suggested bin + reason codes, lets a worker
 * accept it or manually override with a different bin (with a required reason), then complete the
 * task (writes the inventory movement + bin capacity update server-side).
 */
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/hooks/use-toast';
import { PATHS } from '@/lib/paths';
import { errorMessage } from '@/api/client';
import { usePutawayTask, useBin, useAssignPutaway, useCompletePutaway } from '@/api/warehouse';

export default function PutawayTaskDetailPage() {
  const params = useParams<{ taskId: string }>();
  const { toast } = useToast();
  const { data: task, isLoading } = usePutawayTask(params.taskId);
  const { data: suggestedBin } = useBin(task?.suggestedBinId ?? '', { enabled: !!task?.suggestedBinId });
  const [overrideBinId, setOverrideBinId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const assign = useAssignPutaway();
  const complete = useCompletePutaway();

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" /></div>;
  }
  if (!task) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Putaway task not found.</div>;
  }

  const canAssign = task.status === 'pending' || task.status === 'suggested';
  const canComplete = task.status === 'assigned';

  return (
    <main className="space-y-8 pb-24 max-w-3xl">
      <div>
        <Link href={PATHS.WAREHOUSE_PUTAWAY}>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Putaway Queue</Button>
        </Link>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tighter font-mono">{task.id.slice(0, 8)}</h2>
          <StatusBadge status={task.status} />
        </div>
        <p className="text-sm text-muted-foreground font-medium mt-1">{task.quantity} {task.unit} — {task.strategy.replace(/_/g, ' ')}</p>
      </div>

      <Card className="rounded-2xl border-2">
        <CardHeader><CardTitle className="text-sm font-black uppercase tracking-wide flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Engine Suggestion</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {task.suggestedBinId ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Suggested Bin</span>
                <span className="font-mono text-sm font-bold text-primary">{suggestedBin?.code || suggestedBin?.barcode || task.suggestedBinId.slice(0, 8)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {task.reasonCodes.map((code) => <Badge key={code} variant="outline" className="text-[9px] font-black uppercase">{code.replace(/_/g, ' ')}</Badge>)}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">No bin qualified — every candidate failed hazard/temperature/capacity constraints even after relaxing zone scope and ABC stratification. Assign a bin manually below.</p>
          )}
        </CardContent>
      </Card>

      {canAssign && (
        <Card className="rounded-2xl border-2">
          <CardHeader><CardTitle className="text-sm font-black uppercase tracking-wide">Assign</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {task.suggestedBinId && (
              <Button
                className="w-full font-bold uppercase text-xs"
                disabled={assign.isPending}
                onClick={() => assign.mutate(
                  { id: task.id, binId: task.suggestedBinId! },
                  {
                    onSuccess: () => toast({ title: 'Suggestion accepted' }),
                    onError: (err) => toast({ title: 'Could not assign', description: errorMessage(err), variant: 'destructive' }),
                  },
                )}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Accept Suggested Bin
              </Button>
            )}
            <div className="border-t pt-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Or override with a different bin</p>
              <div className="space-y-2">
                <Label htmlFor="override-bin">Bin ID</Label>
                <Input id="override-bin" value={overrideBinId} onChange={(e) => setOverrideBinId(e.target.value)} placeholder="uuid of the target bin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="override-reason">Override reason (required)</Label>
                <Input id="override-reason" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="e.g. closer to the packing zone" />
              </div>
              <Button
                variant="outline"
                className="font-bold uppercase text-xs"
                disabled={!overrideBinId || !overrideReason || assign.isPending}
                onClick={() => assign.mutate(
                  { id: task.id, binId: overrideBinId, overrideReason },
                  {
                    onSuccess: () => toast({ title: 'Manual override recorded' }),
                    onError: (err) => toast({ title: 'Could not assign', description: errorMessage(err), variant: 'destructive' }),
                  },
                )}
              >
                Override & Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canComplete && (
        <Button
          className="font-bold uppercase text-xs"
          disabled={complete.isPending}
          onClick={() => complete.mutate(task.id, {
            onSuccess: () => toast({ title: 'Putaway completed', description: 'Inventory movement recorded and bin capacity updated.' }),
            onError: (err) => toast({ title: 'Could not complete', description: errorMessage(err), variant: 'destructive' }),
          })}
        >
          {complete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Complete Putaway</>}
        </Button>
      )}
    </main>
  );
}
