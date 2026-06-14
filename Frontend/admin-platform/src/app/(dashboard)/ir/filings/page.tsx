'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Plus, MoreHorizontal, Pencil, Trash2, ExternalLink } from 'lucide-react';
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
import { useFilings, useSaveFiling, useDeleteFiling } from '@/lib/queries/ir-modules.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import { FILING_TYPES, FILING_STATUSES, LABEL, type Filing, type FilingType, type FilingStatus } from '@/lib/types/ir-modules.types';

const BLANK = { title: '', filing_type: '10-K' as FilingType, regulator: 'SEC', filing_date: new Date().toISOString().slice(0, 10), period_of_report: '', status: 'filed' as FilingStatus, file_url: '', external_url: '', description: '' };

export default function FilingsPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading } = useFilings({ page: 1, limit: 200 });
  const save = useSaveFiling();
  const del = useDeleteFiling();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);

  useEffect(() => { setBreadcrumbs([{ label: 'Investor Relations', href: '/ir' }, { label: 'Regulatory Filings' }]); }, [setBreadcrumbs]);
  const rows = data?.items ?? [];

  const openNew = () => { setEditId(null); setForm(BLANK); setOpen(true); };
  const openEdit = (f: Filing) => {
    setEditId(f.id);
    setForm({ title: f.title, filing_type: f.filing_type, regulator: f.regulator ?? '', filing_date: f.filing_date?.slice(0, 10) ?? BLANK.filing_date, period_of_report: f.period_of_report?.slice(0, 10) ?? '', status: f.status, file_url: f.file_url ?? '', external_url: f.external_url ?? '', description: f.description ?? '' });
    setOpen(true);
  };
  const submit = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const body = {
      title: form.title.trim(), filing_type: form.filing_type, status: form.status,
      regulator: form.regulator.trim() || undefined, filing_date: form.filing_date,
      period_of_report: form.period_of_report || undefined,
      file_url: form.file_url.trim() || undefined, external_url: form.external_url.trim() || undefined,
      description: form.description.trim() || undefined,
    };
    save.mutate({ id: editId ?? undefined, body }, { onSuccess: () => setOpen(false) });
  };

  const columns: ColumnDef<Filing>[] = [
    { accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Filing" />, cell: ({ row }) => <span className="text-sm font-medium">{row.original.title}</span> },
    { accessorKey: 'filing_type', header: 'Form', cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.original.filing_type}</Badge> },
    { accessorKey: 'regulator', header: 'Regulator', cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.regulator ?? '—'}</span> },
    { accessorKey: 'filing_date', header: ({ column }) => <DataTableColumnHeader column={column} title="Filed" />, cell: ({ row }) => <span className="text-sm">{row.original.filing_date ? formatDate(row.original.filing_date) : '—'}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            {(row.original.file_url || row.original.external_url) && (
              <DropdownMenuItem asChild><a href={(row.original.file_url || row.original.external_url)!} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Open</a></DropdownMenuItem>
            )}
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
      <PageHeader title="Regulatory Filings" description="SEC / SEBI / MCA filings — 10-K, 10-Q, 8-K, proxies and prospectuses." actions={<Button size="sm" onClick={openNew}><Plus className="mr-2 h-4 w-4" />New filing</Button>} />
      <DataTable columns={columns} data={rows} isLoading={isLoading} searchColumn="title" searchPlaceholder="Search filings..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit filing' : 'New filing'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Form</Label>
                <Select value={form.filing_type} onValueChange={(v) => setForm({ ...form, filing_type: v as FilingType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FILING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Regulator</Label><Input value={form.regulator} onChange={(e) => setForm({ ...form, regulator: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as FilingStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FILING_STATUSES.map((s) => <SelectItem key={s} value={s}>{LABEL(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Filing date</Label><Input type="date" value={form.filing_date} onChange={(e) => setForm({ ...form, filing_date: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Period of report</Label><Input type="date" value={form.period_of_report} onChange={(e) => setForm({ ...form, period_of_report: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>File URL</Label><Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://…" /></div>
              <div className="space-y-1.5"><Label>External URL</Label><Input value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} placeholder="EDGAR link…" /></div>
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
