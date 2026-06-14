'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, Search, Plus, Pencil, Trash2 } from 'lucide-react';
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
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
} from '@/lib/queries/crm.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { formatDate } from '@/lib/utils/format';
import type { Appointment, AppointmentPayload } from '@/lib/types/crm.types';

interface AppointmentForm {
  customerName: string;
  customerEmail: string;
  customerId: string;
  type: string;
  date: string;
  time: string;
  city: string;
  notes: string;
  status: string;
}

const defaultForm: AppointmentForm = {
  customerName: '',
  customerEmail: '',
  customerId: '',
  type: 'styling',
  date: '',
  time: '',
  city: '',
  notes: '',
  status: 'scheduled',
};

export default function AppointmentsPage() {
  const { setBreadcrumbs } = useUIStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState<AppointmentForm>(defaultForm);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useAppointments({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
  });
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();

  useEffect(() => {
    setBreadcrumbs([{ label: 'CRM & Marketing', href: '/crm' }, { label: 'Appointments' }]);
  }, [setBreadcrumbs]);

  const appointments = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    setForm({
      customerName: a.customerName,
      customerEmail: a.customerEmail ?? '',
      customerId: a.customerId ?? '',
      type: a.type ?? 'styling',
      date: a.date ? a.date.slice(0, 10) : '',
      time: a.time ?? '',
      city: a.city ?? '',
      notes: a.notes ?? '',
      status: a.status ?? 'scheduled',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: AppointmentPayload = {
      customerName: form.customerName,
      customerEmail: form.customerEmail || undefined,
      customerId: form.customerId || undefined,
      type: form.type,
      date: form.date ? new Date(form.date).toISOString() : undefined,
      time: form.time || undefined,
      city: form.city || undefined,
      notes: form.notes || undefined,
      status: form.status,
    };
    if (editing) {
      updateAppointment.mutate({ id: editing.id, payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createAppointment.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description={`${total} appointments`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarClock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No appointments yet</p>
              <Button size="sm" onClick={openCreate}>Add Appointment</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{a.customerName}</p>
                      {a.customerEmail && <p className="text-xs text-muted-foreground">{a.customerEmail}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{a.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{a.date ? formatDate(a.date) : '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.time ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.city ?? '—'}</TableCell>
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
                          onClick={() => deleteAppointment.mutate(a.id)}
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
            <DialogTitle>{editing ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="styling">Styling</SelectItem>
                    <SelectItem value="fitting">Fitting</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="concierge">Concierge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Dubai" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Customer ID</Label>
              <Input value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} placeholder="Optional linked customer ID" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.customerName.trim() || createAppointment.isPending || updateAppointment.isPending}
            >
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
