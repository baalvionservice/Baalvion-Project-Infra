/**
 * @file warehouse-management/receiving/page.tsx
 * @description Receiving workflow — list Goods Receipt Notes and open a new one against a warehouse.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable } from '@/components/shared/data-table';
import { useToast } from '@/hooks/use-toast';
import { PATHS } from '@/lib/paths';
import { errorMessage } from '@/api/client';
import { useWarehouses, useGrns, useCreateGrn, type GoodsReceiptNote } from '@/api/warehouse';

function NewGrnDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: warehouses } = useWarehouses({ limit: 100 });
  const [warehouseId, setWarehouseId] = useState('');
  const [open, setOpen] = useState(false);
  const createGrn = useCreateGrn();

  const handleSubmit = () => {
    createGrn.mutate(
      { warehouseId },
      {
        onSuccess: (grn) => {
          toast({ title: 'GRN opened', description: grn.grnNumber });
          setOpen(false);
          router.push(`${PATHS.WAREHOUSE_RECEIVING}/${grn.id}`);
        },
        onError: (err) => toast({ title: 'Could not open GRN', description: errorMessage(err), variant: 'destructive' }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold uppercase text-xs"><Plus className="mr-2 h-4 w-4" /> New Receipt</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Open a Goods Receipt Note</DialogTitle></DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Warehouse</Label>
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger><SelectValue placeholder="Select a warehouse" /></SelectTrigger>
            <SelectContent>
              {(warehouses?.items ?? []).map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!warehouseId || createGrn.isPending}>
            {createGrn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Open GRN'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ReceivingPage() {
  const router = useRouter();
  const { data: grns, isLoading } = useGrns({ limit: 50 });

  return (
    <main className="space-y-8 pb-24">
      <div className="flex items-center justify-between border-b pb-8">
        <div>
          <Link href={PATHS.WAREHOUSE_MANAGEMENT}>
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Warehouse Map</Button>
          </Link>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Warehouse Management System — Phase A</p>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Receiving</h2>
        </div>
        <NewGrnDialog />
      </div>

      <DataTable<GoodsReceiptNote>
        isLoading={isLoading}
        data={grns?.items ?? []}
        emptyMessage="No goods receipt notes yet."
        onRowClick={(row) => router.push(`${PATHS.WAREHOUSE_RECEIVING}/${row.id}`)}
        columns={[
          { header: 'GRN Number', accessorKey: 'grnNumber', cell: (r) => <span className="font-mono text-xs font-bold text-primary">{r.grnNumber}</span> },
          { header: 'Supplier Ref', accessorKey: 'supplierReference', cell: (r) => r.supplierReference || '—' },
          { header: 'Status', accessorKey: 'status', cell: (r) => <StatusBadge status={r.status} /> },
          { header: 'Received At', accessorKey: 'receivedAt', cell: (r) => (r.receivedAt ? new Date(r.receivedAt).toLocaleString() : '—') },
        ]}
      />
    </main>
  );
}
