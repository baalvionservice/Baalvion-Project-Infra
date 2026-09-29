'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Plus, MoreHorizontal, Pencil, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEvents, useSaveEvent, useDeleteEvent } from '@/lib/queries/ir-modules.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDateTime } from '@/lib/utils/format';
import { EVENT_TYPES, EVENT_STATUSES, LABEL, type IrEvent, type EventType, type EventStatus } from '@/lib/types/ir-modules.types';

const toLocal = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
const BLANK = { title: '', event_type: 'investor_day' as EventType, scheduled_at: '', end_at: '', location: '', webcast_url: '', registration_url: '', description: '', status: 'upcoming' as EventStatus };

export default function EventsPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading } = useEvents({ page: 1, limit: 200 });
  const save = useSaveEvent();
  const del = useDeleteEvent();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);

  useEffect(() => { setBreadcrumbs([{ label: 'Investor Relations', href: '/ir' }, { label: 'Events & Calendar' }]); }, [setBreadcrumbs]);
  const rows = data?.items ?? [];

  const openNew = () => { setEditId(null); setForm(BLANK); setOpen(true); };
  const openEdit = (e: IrEvent) => {
    setEditId(e.id);
    setForm({ title: e.title, event_type: e.event_type, scheduled_at: toLocal(e.scheduled_at), end_at: toLocal(e.end_at), location: e.location ?? '', webcast_url: e.webcast_url ?? '', registration_url: e.registration_url ?? '', description: e.description ?? '', status: e.status });
    setOpen(true);
  };
  const submit = () => {
    if (!form.title.trim() || !form.scheduled_at) { toast.error('Title and date/time are required'); return; }
    const body = {
      title: form.title.trim(), event_type: form.event_type, status: form.status,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      end_at: form.end_at ? new Date(form.end_at).toISOString() : undefined,
      location: form.location.trim() || undefined,
      webcast_url: form.webcast_url.trim() || undefined,
      registration_url: form.registration_url.trim() || undefined,
      description: form.description.trim() || undefined,
    };
    save.mutate({ id: editId ?? undefined, body }, { onSuccess: () => setOpen(false) });
  };

  const columns: ColumnDef<IrEvent>[] = [
    { accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Event" />, cell: ({ row }) => <span className="text-sm font-medium">{row.original.title}</span> },
    { accessorKey: 'event_type', header: 'Type', cell: ({ row }) => <Badge variant="outline" className="text-xs">{LABEL(row.original.event_type)}</Badge> },
    { accessorKey: 'scheduled_at', header: ({ column }) => <DataTableColumnHeader column={column} title="When" />, cell: ({ row }) => <span className="text-sm">{formatDateTime(row.original.scheduled_at)}</span> },
    { accessorKey: 'location', header: 'Location', cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.location ?? '—'}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(`Delete "${row.original.title}"?`)) del.mutate(row.original.id); }}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild><Link href="/ir"><ArrowLeft className="mr-1 h-4 w-4" />Investor Relations</Link></Button>
      <PageHeader title="Events & Calendar" description="AGM, investor days, roadshows, conferences and webinars." actions={<Button size="sm" onClick={openNew}><Plus className="mr-2 h-4 w-4" />New event</Button>} />
      <DataTable columns={columns} data={rows} isLoading={isLoading} searchColumn="title" searchPlaceholder="Search events..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit event' : 'New event'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v as EventType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{LABEL(t)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as EventStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{LABEL(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>End (optional)</Label><Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. New York / Virtual" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Webcast URL</Label><Input value={form.webcast_url} onChange={(e) => setForm({ ...form, webcast_url: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Registration URL</Label><Input value={form.registration_url} onChange={(e) => setForm({ ...form, registration_url: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={save.isPending} onClick={submit}>{save.isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
