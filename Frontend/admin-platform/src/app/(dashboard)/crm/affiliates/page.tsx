'use client';

import { useEffect, useState } from 'react';
import { Share2, Search, Plus, Pencil, Trash2 } from 'lucide-react';
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
  useAffiliates,
  useCreateAffiliate,
  useUpdateAffiliate,
  useDeleteAffiliate,
} from '@/lib/queries/crm.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { formatMoney } from '@/lib/utils/format';
import type { Affiliate, AffiliatePayload } from '@/lib/types/crm.types';

interface AffiliateForm {
  name: string;
  tier: string;
  referralCode: string;
  salesGenerated: string;
  commissionEarned: string;
  status: string;
}

const defaultForm: AffiliateForm = {
  name: '',
  tier: 'standard',
  referralCode: '',
  salesGenerated: '',
  commissionEarned: '',
  status: 'active',
};

export default function AffiliatesPage() {
  const { setBreadcrumbs } = useUIStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Affiliate | null>(null);
  const [form, setForm] = useState<AffiliateForm>(defaultForm);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useAffiliates({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
  });
  const createAffiliate = useCreateAffiliate();
  const updateAffiliate = useUpdateAffiliate();
  const deleteAffiliate = useDeleteAffiliate();

  useEffect(() => {
    setBreadcrumbs([{ label: 'CRM & Marketing', href: '/crm' }, { label: 'Affiliates' }]);
  }, [setBreadcrumbs]);

  const affiliates = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (a: Affiliate) => {
    setEditing(a);
    setForm({
      name: a.name,
      tier: a.tier ?? 'standard',
      referralCode: a.referralCode ?? '',
      salesGenerated: a.salesGenerated != null ? String(a.salesGenerated) : '',
      commissionEarned: a.commissionEarned != null ? String(a.commissionEarned) : '',
      status: a.status ?? 'active',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: AffiliatePayload = {
      name: form.name,
      tier: form.tier,
      referralCode: form.referralCode,
      salesGenerated: form.salesGenerated ? Number(form.salesGenerated) : undefined,
      commissionEarned: form.commissionEarned ? Number(form.commissionEarned) : undefined,
      status: form.status,
    };
    if (editing) {
      updateAffiliate.mutate({ id: editing.id, payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createAffiliate.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliates"
        description={`${total} affiliates`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Affiliate
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search affiliates..."
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
          ) : affiliates.length === 0 ? (
            <div className="py-16 text-center">
              <Share2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No affiliates yet</p>
              <Button size="sm" onClick={openCreate}>Add Affiliate</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Sales Generated</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm font-medium">{a.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{a.tier}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.referralCode}</TableCell>
                    <TableCell className="text-sm font-medium">{formatMoney(a.salesGenerated ?? 0)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatMoney(a.commissionEarned ?? 0)}</TableCell>
                    <TableCell><StatusBadge status={a.status} className="text-xs" /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteAffiliate.mutate(a.id)}
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
            <DialogTitle>{editing ? 'Edit Affiliate' : 'New Affiliate'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Affiliate name" />
              </div>
              <div className="space-y-1.5">
                <Label>Referral Code *</Label>
                <Input value={form.referralCode} onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value.toUpperCase() }))} placeholder="LUXE10" className="font-mono uppercase" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Tier</Label>
                <Select value={form.tier} onValueChange={(v) => setForm((f) => ({ ...f, tier: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sales Generated</Label>
                <Input type="number" value={form.salesGenerated} onChange={(e) => setForm((f) => ({ ...f, salesGenerated: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Commission Earned</Label>
                <Input type="number" value={form.commissionEarned} onChange={(e) => setForm((f) => ({ ...f, commissionEarned: e.target.value }))} placeholder="0" />
              </div>
            </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.referralCode.trim() || createAffiliate.isPending || updateAffiliate.isPending}
            >
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
