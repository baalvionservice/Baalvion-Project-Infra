'use client';

import { useEffect, useState } from 'react';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDiscounts, useCreateDiscount, useUpdateDiscount, useDeleteDiscount } from '@/lib/queries/commerce-stores.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import type { CommerceDiscount, CreateDiscountPayload } from '@/lib/types/commerce.types';

interface DiscountForm {
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
  value: string;
  minOrderAmount: string;
  maxUses: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const defaultForm: DiscountForm = {
  code: '',
  type: 'percentage',
  value: '',
  minOrderAmount: '',
  maxUses: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
};

export default function DiscountsPage() {
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId } = useCommerceStore();
  const storeId = activeStoreId ?? '';

  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommerceDiscount | null>(null);
  const [form, setForm] = useState<DiscountForm>(defaultForm);

  const { data, isLoading } = useDiscounts(storeId, { page, limit: 20 });
  const createDiscount = useCreateDiscount(storeId);
  const updateDiscount = useUpdateDiscount(storeId);
  const deleteDiscount = useDeleteDiscount(storeId);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Discounts' }]);
  }, [setBreadcrumbs]);

  const discounts = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (d: CommerceDiscount) => {
    setEditing(d);
    setForm({
      code: d.code,
      type: d.type,
      value: String(d.value),
      minOrderAmount: (d.minOrderAmount ?? d.minPurchaseAmount) != null ? String(d.minOrderAmount ?? d.minPurchaseAmount) : '',
      maxUses: (d.maxUses ?? d.usageLimit) != null ? String(d.maxUses ?? d.usageLimit) : '',
      startsAt: d.startsAt ? d.startsAt.slice(0, 10) : '',
      endsAt: d.endsAt ? d.endsAt.slice(0, 10) : '',
      isActive: d.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: CreateDiscountPayload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      isActive: form.isActive,
    };
    if (editing) {
      updateDiscount.mutate({ discountId: editing.id, payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createDiscount.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Tag className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Select a store from the Commerce overview.</p>
        <Button asChild variant="outline"><Link href="/commerce">Go to Overview</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts"
        description={`${total} discount codes`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Discount
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : discounts.length === 0 ? (
            <div className="py-16 text-center">
              <Tag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No discounts yet</p>
              <Button size="sm" onClick={openCreate}>Create Discount</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs font-medium">{d.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {d.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {d.type === 'percentage' ? `${d.value}%` : d.type === 'free_shipping' ? 'Free' : `${d.value}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.usedCount ?? d.usageCount ?? 0}{(d.maxUses ?? d.usageLimit) ? ` / ${d.maxUses ?? d.usageLimit}` : ''}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.endsAt ? formatDate(d.endsAt) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.isActive ? 'success' : 'secondary'} className="text-xs">
                        {d.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(d)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteDiscount.mutate(d.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Discount' : 'New Discount'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="SUMMER20"
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as DiscountForm['type'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.type !== 'free_shipping' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Value *</Label>
                  <Input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder={form.type === 'percentage' ? '20' : '1000'}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Min Order Amount</Label>
                  <Input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                    placeholder="5000"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Starts At</Label>
                <Input
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ends At</Label>
                <Input
                  type="date"
                  value={form.endsAt}
                  onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Active</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.code || (form.type !== 'free_shipping' && !form.value) || createDiscount.isPending || updateDiscount.isPending}
            >
              {editing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
