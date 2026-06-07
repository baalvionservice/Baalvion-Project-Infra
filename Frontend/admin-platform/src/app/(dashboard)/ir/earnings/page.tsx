'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Plus, MoreHorizontal, Pencil, Mic } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEarnings, useSaveEarnings } from '@/lib/queries/ir-modules.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDateTime } from '@/lib/utils/format';
import { EARNINGS_STATUSES, LABEL, type EarningsCall, type EarningsStatus } from '@/lib/types/ir-modules.types';

const toLocal = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
const CURRENT_YEAR = 2026;
const BLANK = { title: '', year: String(CURRENT_YEAR), quarter: '', scheduled_at: '', status: 'scheduled' as EarningsStatus, webcast_url: '', replay_url: '', dial_in_info: '', summary: '', transcript: '' };

export default function EarningsPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading } = useEarnings({ page: 1, limit: 200 });
  const save = useSaveEarnings();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);

  useEffect(() => { setBreadcrumbs([{ label: 'Investor Relations', href: '/ir' }, { label: 'Earnings' }]); }, [setBreadcrumbs]);
  const rows = data?.items ?? [];

  const openNew = () => { setEditId(null); setForm(BLANK); setOpen(true); };
  const openEdit = (e: EarningsCall) => {
    setEditId(e.id);
    setForm({ title: e.title, year: String(e.year), quarter: e.quarter ? String(e.quarter) : '', scheduled_at: toLocal(e.scheduled_at), status: e.status, webcast_url: e.webcast_url ?? '', replay_url: e.replay_url ?? '', dial_in_info: e.dial_in_info ?? '', summary: e.summary ?? '', transcript: e.transcript ?? '' });
    setOpen(true);
  };
  const submit = () => {
    if (!form.title.trim() || !form.year) { toast.error('Title and year are required'); return; }
    const body = {
      title: form.title.trim(), year: Number(form.year), quarter: form.quarter ? Number(form.quarter) : null,
      status: form.status, scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : undefined,
      webcast_url: form.webcast_url.trim() || undefined, replay_url: form.replay_url.trim() || undefined,
      dial_in_info: form.dial_in_info.trim() || undefined, summary: form.summary.trim() || undefined,
      transcript: form.transcript.trim() || undefined,
    };
    save.mutate({ id: editId ?? undefined, body }, { onSuccess: () => setOpen(false) });
  };

  const columns: ColumnDef<EarningsCall>[] = [
    { accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Call" />, cell: ({ row }) => <span className="text-sm font-medium">{row.original.title}</span> },
    { id: 'period', header: 'Period', cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.quarter ? `Q${row.original.quarter} ` : 'FY '}{row.original.year}</span> },
    { accessorKey: 'scheduled_at', header: ({ column }) => <DataTableColumnHeader column={column} title="When" />, cell: ({ row }) => <span className="text-sm">{row.original.scheduled_at ? formatDateTime(row.original.scheduled_at) : '—'}</span> },
    { id: 'transcript', header: 'Transcript', cell: ({ row }) => row.original.transcript ? <Mic className="h-4 w-4 text-green-600" /> : <span className="text-xs text-muted-foreground">—</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEdit(row.original)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild><Link href="/ir"><ArrowLeft className="mr-1 h-4 w-4" />Investor Relations</Link></Button>
      <PageHeader title="Earnings" description="Earnings calls, webcasts and transcripts." actions={<Button size="sm" onClick={openNew}><Plus className="mr-2 h-4 w-4" />New call</Button>} />
      <DataTable columns={columns} data={rows} isLoading={isLoading} searchColumn="title" searchPlaceholder="Search calls..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit earnings call' : 'New earnings call'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Q2 FY2026 Earnings Call" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Quarter</Label>
                <Select value={form.quarter || '__none__'} onValueChange={(v) => setForm({ ...form, quarter: v === '__none__' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent><SelectItem value="__none__">None</SelectItem><SelectItem value="1">Q1</SelectItem><SelectItem value="2">Q2</SelectItem><SelectItem value="3">Q3</SelectItem><SelectItem value="4">Q4</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as EarningsStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EARNINGS_STATUSES.map((s) => <SelectItem key={s} value={s}>{LABEL(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Scheduled at</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Webcast URL</Label><Input value={form.webcast_url} onChange={(e) => setForm({ ...form, webcast_url: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Replay URL</Label><Input value={form.replay_url} onChange={(e) => setForm({ ...form, replay_url: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Dial-in info</Label><Input value={form.dial_in_info} onChange={(e) => setForm({ ...form, dial_in_info: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Summary</Label><Textarea rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Transcript</Label><Textarea rows={4} value={form.transcript} onChange={(e) => setForm({ ...form, transcript: e.target.value })} placeholder="Paste the call transcript here." /></div>
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
