'use client';

import { useEffect, useState } from 'react';
import { Store, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
} from '@/lib/queries/crm.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { formatMoney, formatNumber, formatDate } from '@/lib/utils/format';
import type { Vendor, VendorPayload } from '@/lib/types/crm.types';

interface VendorForm {
  name: string;
  category: string;
  performance: string;
  productCount: string;
  salesTotal: string;
  status: string;
  payoutSchedule: string;
  joinedDate: string;
}

const defaultForm: VendorForm = {
  name: '',
  category: '',
  performance: '',
  productCount: '',
  salesTotal: '',
  status: 'active',
  payoutSchedule: 'monthly',
  joinedDate: '',
};

export default function VendorsPage() {
  const { setBreadcrumbs } = useUIStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<VendorForm>(defaultForm);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useVendors({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
  });
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();

  useEffect(() => {
    setBreadcrumbs([{ label: 'CRM & Marketing', href: '/crm' }, { label: 'Vendors' }]);
  }, [setBreadcrumbs]);

  const vendors = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (v: Vendor) => {
    setEditing(v);
    setForm({
      name: v.name,
      category: v.category ?? '',
      performance: v.performance != null ? String(v.performance) : '',
      productCount: v.productCount != null ? String(v.productCount) : '',
      salesTotal: v.salesTotal != null ? String(v.salesTotal) : '',
      status: v.status ?? 'active',
      payoutSchedule: v.payoutSchedule ?? 'monthly',
      joinedDate: v.joinedDate ? v.joinedDate.slice(0, 10) : '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: VendorPayload = {
      name: form.name,
      category: form.category,
      performance: form.performance ? Number(form.performance) : undefined,
      productCount: form.productCount ? Number(form.productCount) : undefined,
      salesTotal: form.salesTotal ? Number(form.salesTotal) : undefined,
      status: form.status,
      payoutSchedule: form.payoutSchedule || undefined,
      joinedDate: form.joinedDate ? new Date(form.joinedDate).toISOString() : undefined,
    };
    if (editing) {
      updateVendor.mutate({ id: editing.id, payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createVendor.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description={`${total} marketplace vendors`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Vendor
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : vendors.length === 0 ? (
            <div className="py-16 text-center">
              <Store className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No vendors yet</p>
              <Button size="sm" onClick={openCreate}>Add Vendor</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm font-medium">{v.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">{v.category}</TableCell>
                    <TableCell className="text-sm">{formatNumber(v.performance ?? 0)}</TableCell>
                    <TableCell className="text-sm">{formatNumber(v.productCount ?? 0)}</TableCell>
                    <TableCell className="text-sm font-medium">{formatMoney(v.salesTotal ?? 0)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {v.joinedDate ? formatDate(v.joinedDate) : '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={v.status} className="text-xs" /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteVendor.mutate(v.id)}
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
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {total} total</p>
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
            <DialogTitle>{editing ? 'Edit Vendor' : 'New Vendor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Vendor name" />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Jewellery" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Performance</Label>
                <Input type="number" value={form.performance} onChange={(e) => setForm((f) => ({ ...f, performance: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Product Count</Label>
                <Input type="number" value={form.productCount} onChange={(e) => setForm((f) => ({ ...f, productCount: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Sales Total</Label>
                <Input type="number" value={form.salesTotal} onChange={(e) => setForm((f) => ({ ...f, salesTotal: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payout Schedule</Label>
                <Select value={form.payoutSchedule} onValueChange={(v) => setForm((f) => ({ ...f, payoutSchedule: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Joined Date</Label>
                <Input type="date" value={form.joinedDate} onChange={(e) => setForm((f) => ({ ...f, joinedDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.category.trim() || createVendor.isPending || updateVendor.isPending}
            >
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
