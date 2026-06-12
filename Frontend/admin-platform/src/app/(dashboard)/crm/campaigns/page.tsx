'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Search, Plus, Pencil, Trash2, FlaskConical } from 'lucide-react';
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
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
} from '@/lib/queries/crm.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { formatNumber } from '@/lib/utils/format';
import type { Campaign, CampaignPayload } from '@/lib/types/crm.types';

interface CampaignForm {
  title: string;
  type: string;
  status: string;
  discountValue: string;
  startDate: string;
  endDate: string;
  market: string;
  reach: string;
  conversions: string;
  roi: string;
  predictedRoi: string;
  abTestActive: boolean;
}

const defaultForm: CampaignForm = {
  title: '',
  type: 'email',
  status: 'draft',
  discountValue: '',
  startDate: '',
  endDate: '',
  market: '',
  reach: '',
  conversions: '',
  roi: '',
  predictedRoi: '',
  abTestActive: false,
};

export default function CampaignsPage() {
  const { setBreadcrumbs } = useUIStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<CampaignForm>(defaultForm);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useCampaigns({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
  });
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  useEffect(() => {
    setBreadcrumbs([{ label: 'CRM & Marketing', href: '/crm' }, { label: 'Campaigns' }]);
  }, [setBreadcrumbs]);

  const campaigns = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      title: c.title,
      type: c.type ?? 'email',
      status: c.status ?? 'draft',
      discountValue: c.discountValue != null ? String(c.discountValue) : '',
      startDate: c.startDate ? c.startDate.slice(0, 10) : '',
      endDate: c.endDate ? c.endDate.slice(0, 10) : '',
      market: c.market ?? '',
      reach: c.reach != null ? String(c.reach) : '',
      conversions: c.conversions != null ? String(c.conversions) : '',
      roi: c.roi != null ? String(c.roi) : '',
      predictedRoi: c.predictedRoi != null ? String(c.predictedRoi) : '',
      abTestActive: c.abTestActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: CampaignPayload = {
      title: form.title,
      type: form.type,
      status: form.status,
      discountValue: form.discountValue ? Number(form.discountValue) : undefined,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      market: form.market || undefined,
      reach: form.reach ? Number(form.reach) : undefined,
      conversions: form.conversions ? Number(form.conversions) : undefined,
      roi: form.roi ? Number(form.roi) : undefined,
      predictedRoi: form.predictedRoi ? Number(form.predictedRoi) : undefined,
      abTestActive: form.abTestActive,
    };
    if (editing) {
      updateCampaign.mutate({ id: editing.id, payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createCampaign.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description={`${total} campaigns`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No campaigns yet</p>
              <Button size="sm" onClick={openCreate}>Add Campaign</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reach</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{c.title}</p>
                        {c.abTestActive && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <FlaskConical className="h-3 w-3" /> A/B
                          </Badge>
                        )}
                      </div>
                      {c.market && <p className="text-xs text-muted-foreground">{c.market}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{c.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatNumber(c.reach ?? 0)}</TableCell>
                    <TableCell className="text-sm">{formatNumber(c.conversions ?? 0)}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {c.roi != null ? `${c.roi}x` : '—'}
                      {c.predictedRoi != null && (
                        <span className="text-xs text-muted-foreground"> (pred {c.predictedRoi}x)</span>
                      )}
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
                          onClick={() => deleteCampaign.mutate(c.id)}
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
            <DialogTitle>{editing ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Campaign title" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Market</Label>
                <Input value={form.market} onChange={(e) => setForm((f) => ({ ...f, market: e.target.value }))} placeholder="US" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Discount Value</Label>
                <Input type="number" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Reach</Label>
                <Input type="number" value={form.reach} onChange={(e) => setForm((f) => ({ ...f, reach: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Conversions</Label>
                <Input type="number" value={form.conversions} onChange={(e) => setForm((f) => ({ ...f, conversions: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>ROI</Label>
                <Input type="number" step="0.1" value={form.roi} onChange={(e) => setForm((f) => ({ ...f, roi: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Predicted ROI</Label>
                <Input type="number" step="0.1" value={form.predictedRoi} onChange={(e) => setForm((f) => ({ ...f, predictedRoi: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.abTestActive}
                onChange={(e) => setForm((f) => ({ ...f, abTestActive: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">A/B test active</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title.trim() || createCampaign.isPending || updateCampaign.isPending}
            >
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
