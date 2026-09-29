'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, Search, Plus, Pencil, Trash2 } from 'lucide-react';
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
  useSupportTickets,
  useCreateSupportTicket,
  useUpdateSupportTicket,
  useDeleteSupportTicket,
} from '@/lib/queries/crm.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { formatDate } from '@/lib/utils/format';
import type { SupportTicket, SupportTicketPayload, SupportTicketTier } from '@/lib/types/crm.types';

interface SupportTicketForm {
  customerName: string;
  customerEmail: string;
  customerId: string;
  customerTier: SupportTicketTier;
  subject: string;
  status: string;
  priority: string;
  category: string;
  lastMessage: string;
}

const defaultForm: SupportTicketForm = {
  customerName: '',
  customerEmail: '',
  customerId: '',
  customerTier: 'Silver',
  subject: '',
  status: 'open',
  priority: 'normal',
  category: '',
  lastMessage: '',
};

export default function SupportTicketsPage() {
  const { setBreadcrumbs } = useUIStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupportTicket | null>(null);
  const [form, setForm] = useState<SupportTicketForm>(defaultForm);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useSupportTickets({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
  });
  const createSupportTicket = useCreateSupportTicket();
  const updateSupportTicket = useUpdateSupportTicket();
  const deleteSupportTicket = useDeleteSupportTicket();

  useEffect(() => {
    setBreadcrumbs([{ label: 'CRM & Marketing', href: '/crm' }, { label: 'Support Tickets' }]);
  }, [setBreadcrumbs]);

  const tickets = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (t: SupportTicket) => {
    setEditing(t);
    setForm({
      customerName: t.customerName,
      customerEmail: t.customerEmail ?? '',
      customerId: t.customerId ?? '',
      customerTier: t.customerTier ?? 'Silver',
      subject: t.subject ?? '',
      status: t.status ?? 'open',
      priority: t.priority ?? 'normal',
      category: t.category ?? '',
      lastMessage: t.lastMessage ?? '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: SupportTicketPayload = {
      customerName: form.customerName,
      customerEmail: form.customerEmail || undefined,
      customerId: form.customerId || undefined,
      customerTier: form.customerTier,
      subject: form.subject,
      status: form.status,
      priority: form.priority,
      category: form.category || undefined,
      lastMessage: form.lastMessage || undefined,
    };
    if (editing) {
      updateSupportTicket.mutate({ id: editing.id, payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createSupportTicket.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description={`${total} tickets`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center">
              <LifeBuoy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No support tickets yet</p>
              <Button size="sm" onClick={openCreate}>Add Ticket</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{t.customerName}</p>
                      {t.customerEmail && <p className="text-xs text-muted-foreground">{t.customerEmail}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{t.subject}</TableCell>
                    <TableCell><StatusBadge status={t.status} className="text-xs" /></TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{t.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.category ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.updatedAt ? formatDate(t.updatedAt) : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteSupportTicket.mutate(t.id)}
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
            <DialogTitle>{editing ? 'Edit Support Ticket' : 'New Support Ticket'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Customer Name *</Label>
                <Input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label>Customer Email</Label>
                <Input type="email" value={form.customerEmail} onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))} placeholder="name@example.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Ticket subject" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Customer Tier</Label>
                <Select value={form.customerTier} onValueChange={(v) => setForm((f) => ({ ...f, customerTier: v as SupportTicketTier }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Diamond">Diamond</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Orders, Returns" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Customer ID</Label>
              <Input value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} placeholder="Optional linked customer ID" />
            </div>
            <div className="space-y-1.5">
              <Label>Last Message</Label>
              <Input value={form.lastMessage} onChange={(e) => setForm((f) => ({ ...f, lastMessage: e.target.value }))} placeholder="Most recent message" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.customerName.trim() || !form.subject.trim() || createSupportTicket.isPending || updateSupportTicket.isPending}
            >
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
