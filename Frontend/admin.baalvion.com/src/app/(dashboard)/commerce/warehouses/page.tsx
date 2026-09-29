'use client';

import { useEffect, useState } from 'react';
import { Building, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '@/lib/queries/inventory.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import type { InventoryWarehouse } from '@/lib/types/order.types';

interface WarehouseForm {
  name: string;
  code: string;
  address: string;
  city: string;
  countryCode: string;
  isDefault: boolean;
}

const defaultForm: WarehouseForm = { name: '', code: '', address: '', city: '', countryCode: '', isDefault: false };

export default function WarehousesPage() {
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId } = useCommerceStore();
  const storeId = activeStoreId ?? '';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryWarehouse | null>(null);
  const [form, setForm] = useState<WarehouseForm>(defaultForm);

  const { data, isLoading } = useWarehouses(storeId);
  const createWarehouse = useCreateWarehouse(storeId);
  const updateWarehouse = useUpdateWarehouse(storeId);
  const deleteWarehouse = useDeleteWarehouse(storeId);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Warehouses' }]);
  }, [setBreadcrumbs]);

  const warehouses = data?.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (w: InventoryWarehouse) => {
    setEditing(w);
    setForm({
      name: w.name,
      code: w.code,
      address: w.address ?? '',
      city: w.city ?? '',
      countryCode: w.countryCode,
      isDefault: w.isDefault,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      updateWarehouse.mutate({ warehouseId: editing.id, payload: form }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createWarehouse.mutate(form, { onSuccess: () => setDialogOpen(false) });
    }
  };

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Building className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Select a store from the Commerce overview.</p>
        <Button asChild variant="outline"><Link href="/commerce">Go to Overview</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses"
        description={`${warehouses.length} warehouses`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Warehouse
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : warehouses.length === 0 ? (
        <div className="py-16 text-center">
          <Building className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No warehouses configured</p>
          <Button size="sm" onClick={openCreate}>Add Warehouse</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((w) => (
            <Card key={w.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <Building className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{w.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{w.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(w)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteWarehouse.mutate(w.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {(w.address || w.city) && (
                  <div className="flex items-start gap-1.5 mb-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {[w.address, w.city, w.countryCode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {w.isDefault && <Badge variant="success" className="text-xs">Default</Badge>}
                  <Badge variant={w.isActive ? 'success' : 'secondary'} className="text-xs">
                    {w.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Warehouse' : 'New Warehouse'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Main Warehouse"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="WH-UAE-01"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Dubai"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country Code *</Label>
                <Input
                  value={form.countryCode}
                  onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase() }))}
                  placeholder="AE"
                  maxLength={2}
                  className="font-mono"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Set as default warehouse</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name || !form.code || !form.countryCode || createWarehouse.isPending || updateWarehouse.isPending}
            >
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
