'use client';

import { useEffect, useState } from 'react';
import { Warehouse, Search, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useStock, useAdjustStock, useWarehouses } from '@/lib/queries/inventory.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';

const STOCK_STATUS_COLORS: Record<string, string> = {
  in_stock: 'bg-green-100 text-green-700',
  low_stock: 'bg-yellow-100 text-yellow-700',
  out_of_stock: 'bg-red-100 text-red-700',
  discontinued: 'bg-gray-100 text-gray-600',
};

export default function InventoryPage() {
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId } = useCommerceStore();
  const storeId = activeStoreId ?? '';

  const [page, setPage] = useState(1);
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    warehouseId: '',
    sku: '',
    productId: '',
    quantity: '0',
    type: 'adjustment',
    notes: '',
  });

  const { data, isLoading } = useStock(storeId, {
    page,
    limit: 25,
    warehouseId: warehouseFilter || undefined,
    status: statusFilter || undefined,
  });
  const { data: warehousesData } = useWarehouses(storeId);
  const adjustStock = useAdjustStock(storeId);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Inventory' }]);
  }, [setBreadcrumbs]);

  const items = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const warehouses = warehousesData?.data ?? [];

  const lowStock = items.filter((i) => i.status === 'low_stock').length;
  const outOfStock = items.filter((i) => i.status === 'out_of_stock').length;

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Warehouse className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Select a store from the Commerce overview.</p>
        <Button asChild variant="outline"><Link href="/commerce">Go to Overview</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description={`${total} SKUs tracked`}
        actions={
          <Button size="sm" onClick={() => setAdjustDialogOpen(true)}>
            Adjust Stock
          </Button>
        }
      />

      {(lowStock > 0 || outOfStock > 0) && (
        <div className="flex gap-3">
          {lowStock > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 dark:bg-yellow-900/10">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-400">{lowStock} low stock</span>
            </div>
          )}
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:bg-red-900/10">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700 dark:text-red-400">{outOfStock} out of stock</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search SKU..." className="pl-9 h-9" readOnly />
        </div>
        <Select value={warehouseFilter || 'all'} onValueChange={(v) => setWarehouseFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            <SelectItem value="discontinued">Discontinued</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Warehouse className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No stock records found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell className="text-sm">
                      {item.warehouse?.name ?? '—'}
                      {item.warehouse?.code && (
                        <span className="text-xs text-muted-foreground ml-1">({item.warehouse.code})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {item.quantity - item.reservedQuantity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.reservedQuantity}
                    </TableCell>
                    <TableCell className="text-sm">{item.quantity}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STOCK_STATUS_COLORS[item.status] ?? ''}`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {total} total</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Adjust stock dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Warehouse *</Label>
              <select
                value={adjustForm.warehouseId}
                onChange={(e) => setAdjustForm((f) => ({ ...f, warehouseId: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>SKU *</Label>
                <Input
                  value={adjustForm.sku}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="PROD-001"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Product ID *</Label>
                <Input
                  value={adjustForm.productId}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, productId: e.target.value }))}
                  placeholder="uuid"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="adjustment">Adjustment</option>
                  <option value="inbound">Inbound (add)</option>
                  <option value="outbound">Outbound (remove)</option>
                  <option value="return">Return</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!adjustForm.warehouseId || !adjustForm.sku || !adjustForm.productId || adjustStock.isPending}
              onClick={() =>
                adjustStock.mutate(
                  {
                    warehouseId: adjustForm.warehouseId,
                    payload: {
                      sku: adjustForm.sku,
                      productId: adjustForm.productId,
                      quantity: Number(adjustForm.quantity),
                      type: adjustForm.type,
                      notes: adjustForm.notes || undefined,
                    },
                  },
                  { onSuccess: () => setAdjustDialogOpen(false) }
                )
              }
            >
              Adjust
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
