/**
 * @file warehouse-management/receiving/[grnId]/page.tsx
 * @description Goods Receipt Note detail — line items, add-line form, complete/cancel actions.
 * Completing a line here is the hand-off point into the putaway queue (each line becomes eligible
 * for a putaway suggestion once the GRN is completed).
 */
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Plus, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/hooks/use-toast';
import { PATHS } from '@/lib/paths';
import { errorMessage } from '@/api/client';
import { useGrn, useAddGrnLine, useCompleteGrn, useCancelGrn } from '@/api/warehouse';

function AddLineDialog({ grnId }: { grnId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [lotNumber, setLotNumber] = useState('');
  const addLine = useAddGrnLine(grnId);

  const handleSubmit = () => {
    addLine.mutate(
      { sku, receivedQuantity: Number(quantity), lotNumber: lotNumber || undefined },
      {
        onSuccess: () => { toast({ title: 'Line added' }); setOpen(false); setSku(''); setQuantity('1'); setLotNumber(''); },
        onError: (err) => toast({ title: 'Could not add line', description: errorMessage(err), variant: 'destructive' }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="font-bold uppercase text-xs"><Plus className="mr-2 h-4 w-4" /> Add Line</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Line Item</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="qty">Received quantity</Label><Input id="qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="lot">Lot number (optional)</Label><Input id="lot" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!sku || addLine.isPending}>
            {addLine.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Line'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GrnDetailPage() {
  const params = useParams<{ grnId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { data: grn, isLoading } = useGrn(params.grnId);
  const completeGrn = useCompleteGrn();
  const cancelGrn = useCancelGrn();

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" /></div>;
  }
  if (!grn) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Goods receipt note not found.</div>;
  }

  const isOpen = grn.status === 'draft' || grn.status === 'in_progress';

  return (
    <main className="space-y-8 pb-24 max-w-4xl">
      <div>
        <Link href={PATHS.WAREHOUSE_RECEIVING}>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Receiving</Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tighter font-mono text-primary">{grn.grnNumber}</h2>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              {grn.receivedAt ? `Received ${new Date(grn.receivedAt).toLocaleString()}` : 'Not yet received'}
            </p>
          </div>
          <StatusBadge status={grn.status} />
        </div>
      </div>

      <Card className="rounded-2xl border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-wide">Line Items ({grn.lines?.length ?? 0})</CardTitle>
          {isOpen && <AddLineDialog grnId={grn.id} />}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead>Qty Received</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead className="text-right">Putaway</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(grn.lines ?? []).map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-xs font-bold">{line.sku || '—'}</TableCell>
                  <TableCell className="text-xs">{line.lotNumber || '—'}</TableCell>
                  <TableCell className="text-xs font-bold">{line.receivedQuantity} {line.unit}</TableCell>
                  <TableCell><StatusBadge status={line.condition} /></TableCell>
                  <TableCell className="text-right">
                    {line.putawayTaskId ? (
                      <Link href={`${PATHS.WAREHOUSE_PUTAWAY}/${line.putawayTaskId}`} className="text-xs font-bold text-primary inline-flex items-center gap-1">
                        View task <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Pending completion</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!grn.lines || grn.lines.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">No lines yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isOpen && (
        <div className="flex gap-3">
          <Button
            className="font-bold uppercase text-xs"
            disabled={completeGrn.isPending || !grn.lines?.length}
            onClick={() => completeGrn.mutate(grn.id, {
              onSuccess: () => toast({ title: 'GRN completed', description: 'Lines are now ready for putaway suggestions.' }),
              onError: (err) => toast({ title: 'Could not complete', description: errorMessage(err), variant: 'destructive' }),
            })}
          >
            {completeGrn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Complete Receipt</>}
          </Button>
          <Button
            variant="outline"
            className="font-bold uppercase text-xs"
            disabled={cancelGrn.isPending}
            onClick={() => cancelGrn.mutate(grn.id, {
              onSuccess: () => toast({ title: 'GRN cancelled' }),
              onError: (err) => toast({ title: 'Could not cancel', description: errorMessage(err), variant: 'destructive' }),
            })}
          >
            <XCircle className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      )}
    </main>
  );
}
