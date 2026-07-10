/**
 * @file warehouse-management/putaway/page.tsx
 * @description Putaway task queue — run the rule-based putaway engine against a warehouse/quantity
 * and review pending/suggested/assigned tasks. Real data via src/api/warehouse.ts.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/hooks/use-toast';
import { PATHS } from '@/lib/paths';
import { errorMessage } from '@/api/client';
import {
  useWarehouses, usePutawayTasks, useSuggestPutaway, type PutawayTask, type PutawayStrategy,
} from '@/api/warehouse';

const STRATEGIES: PutawayStrategy[] = ['fifo', 'fefo', 'abc', 'capacity_first'];

function SuggestPutawayDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: warehouses } = useWarehouses({ limit: 100 });
  const [open, setOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [strategy, setStrategy] = useState<PutawayStrategy>('fifo');
  const suggest = useSuggestPutaway();

  const handleSubmit = () => {
    suggest.mutate(
      { warehouseId, quantity: Number(quantity), strategy },
      {
        onSuccess: ({ task, warnings }) => {
          if (warnings.length) {
            toast({ title: 'Suggestion generated with warnings', description: warnings.join('; ') });
          } else {
            toast({ title: 'Bin suggested', description: `Task ${task.id.slice(0, 8)} is ready for review.` });
          }
          setOpen(false);
          router.push(`${PATHS.WAREHOUSE_PUTAWAY}/${task.id}`);
        },
        onError: (err) => toast({ title: 'Could not generate a suggestion', description: errorMessage(err), variant: 'destructive' }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold uppercase text-xs"><Sparkles className="mr-2 h-4 w-4" /> Run Putaway Suggestion</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Suggest a Putaway Bin</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger><SelectValue placeholder="Select a warehouse" /></SelectTrigger>
              <SelectContent>
                {(warehouses?.items ?? []).map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qty">Quantity</Label>
            <Input id="qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Strategy</Label>
            <Select value={strategy} onValueChange={(v) => setStrategy(v as PutawayStrategy)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!warehouseId || suggest.isPending}>
            {suggest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate Suggestion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PutawayQueuePage() {
  const router = useRouter();
  const { data: tasks, isLoading } = usePutawayTasks({ limit: 50 });

  return (
    <main className="space-y-8 pb-24">
      <div className="flex items-center justify-between border-b pb-8">
        <div>
          <Link href={PATHS.WAREHOUSE_MANAGEMENT}>
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Warehouse Map</Button>
          </Link>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Warehouse Management System — Phase A</p>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Putaway Task Queue</h2>
        </div>
        <SuggestPutawayDialog />
      </div>

      <DataTable<PutawayTask>
        isLoading={isLoading}
        data={tasks?.items ?? []}
        emptyMessage="No putaway tasks yet."
        onRowClick={(row) => router.push(`${PATHS.WAREHOUSE_PUTAWAY}/${row.id}`)}
        columns={[
          { header: 'Task', accessorKey: 'id', cell: (r) => <span className="font-mono text-xs font-bold text-primary">{r.id.slice(0, 8)}</span> },
          { header: 'Quantity', accessorKey: 'quantity', cell: (r) => `${r.quantity} ${r.unit}` },
          { header: 'Strategy', accessorKey: 'strategy', cell: (r) => r.strategy.replace(/_/g, ' ') },
          { header: 'Reason Codes', accessorKey: 'reasonCodes', cell: (r) => r.reasonCodes.join(', ') || '—' },
          { header: 'Status', accessorKey: 'status', cell: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </main>
  );
}
