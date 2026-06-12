'use client';

import { useEffect, useState } from 'react';
import { Crown, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
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
import {
  useVipClients,
  useCreateVipClient,
  useUpdateVipClient,
  useDeleteVipClient,
} from '@/lib/queries/crm.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { formatMoney, formatNumber, formatDate } from '@/lib/utils/format';
import type { VipClient, VipClientPayload, VipTier } from '@/lib/types/crm.types';

interface VipForm {
  name: string;
  email: string;
  tier: VipTier;
  loyaltyPoints: string;
  totalSpend: string;
  walletBalance: string;
  subscriptionPlan: string;
  isSubscriber: boolean;
  status: string;
}

const defaultForm: VipForm = {
  name: '',
  email: '',
  tier: 'Silver',
  loyaltyPoints: '',
  totalSpend: '',
  walletBalance: '',
  subscriptionPlan: '',
  isSubscriber: false,
  status: 'active',
};

const TIER_VARIANT: Record<VipTier, 'secondary' | 'warning' | 'success'> = {
  Silver: 'secondary',
  Gold: 'warning',
  Diamond: 'success',
};

export default function VipClientsPage() {
  const { setBreadcrumbs } = useUIStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VipClient | null>(null);
  const [form, setForm] = useState<VipForm>(defaultForm);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useVipClients({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
  });
  const createClient = useCreateVipClient();
  const updateClient = useUpdateVipClient();
  const deleteClient = useDeleteVipClient();

  useEffect(() => {
    setBreadcrumbs([{ label: 'CRM & Marketing', href: '/crm' }, { label: 'VIP Clients' }]);
  }, [setBreadcrumbs]);

  const clients = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (c: VipClient) => {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email,
      tier: c.tier,
      loyaltyPoints: c.loyaltyPoints != null ? String(c.loyaltyPoints) : '',
      totalSpend: c.totalSpend != null ? String(c.totalSpend) : '',
      walletBalance: c.walletBalance != null ? String(c.walletBalance) : '',
      subscriptionPlan: c.subscriptionPlan ?? '',
      isSubscriber: c.isSubscriber,
      status: c.status ?? 'active',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: VipClientPayload = {
      name: form.name,
      email: form.email,
      tier: form.tier,
      loyaltyPoints: form.loyaltyPoints ? Number(form.loyaltyPoints) : undefined,
      totalSpend: form.totalSpend ? Number(form.totalSpend) : undefined,
      walletBalance: form.walletBalance ? Number(form.walletBalance) : undefined,
      subscriptionPlan: form.subscriptionPlan || undefined,
      isSubscriber: form.isSubscriber,
      status: form.status,
    };
    if (editing) {
      updateClient.mutate({ id: editing.id, payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createClient.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="VIP Clients"
        description={`${total} clients`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
          ) : clients.length === 0 ? (
            <div className="py-16 text-center">
              <Crown className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No VIP clients yet</p>
              <Button size="sm" onClick={openCreate}>Add Client</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Loyalty</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Last Purchase</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TIER_VARIANT[c.tier]} className="text-xs">{c.tier}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatNumber(c.loyaltyPoints ?? 0)}</TableCell>
                    <TableCell className="text-sm font-medium">{formatMoney(c.totalSpend ?? 0)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatMoney(c.walletBalance ?? 0)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.lastPurchase ? formatDate(c.lastPurchase) : '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={c.status} className="text-xs" /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteClient.mutate(c.id)}
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
            <DialogTitle>{editing ? 'Edit VIP Client' : 'New VIP Client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="name@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tier *</Label>
                <Select value={form.tier} onValueChange={(v) => setForm((f) => ({ ...f, tier: v as VipTier }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Diamond">Diamond</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Loyalty Points</Label>
                <Input type="number" value={form.loyaltyPoints} onChange={(e) => setForm((f) => ({ ...f, loyaltyPoints: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Total Spend</Label>
                <Input type="number" value={form.totalSpend} onChange={(e) => setForm((f) => ({ ...f, totalSpend: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Wallet Balance</Label>
                <Input type="number" value={form.walletBalance} onChange={(e) => setForm((f) => ({ ...f, walletBalance: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subscription Plan</Label>
              <Input value={form.subscriptionPlan} onChange={(e) => setForm((f) => ({ ...f, subscriptionPlan: e.target.value }))} placeholder="e.g. Atelier Monthly" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isSubscriber}
                onChange={(e) => setForm((f) => ({ ...f, isSubscriber: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Active subscriber</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.email.trim() || createClient.isPending || updateClient.isPending}
            >
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
