'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Plus, MoreHorizontal, Pencil, Trash2, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useShareholders, useSaveShareholder, useDeleteShareholder } from '@/lib/queries/ir-modules.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatNumber, formatDate } from '@/lib/utils/format';
import { SHAREHOLDER_TYPES, LABEL, type Shareholder, type ShareholderType } from '@/lib/types/ir-modules.types';

const BLANK = { name: '', type: 'institutional' as ShareholderType, shares_held: '', ownership_pct: '', as_of_date: new Date().toISOString().slice(0, 10), country: '' };

export default function ShareholdersPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading } = useShareholders({ page: 1, limit: 200 });
  const save = useSaveShareholder();
  const del = useDeleteShareholder();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Investor Relations', href: '/ir' }, { label: 'Shareholders' }]);
  }, [setBreadcrumbs]);

  const rows = data?.items ?? [];

  const openNew = () => { setEditId(null); setForm(BLANK); setOpen(true); };
  const openEdit = (s: Shareholder) => {
    setEditId(s.id);
    setForm({ name: s.name, type: s.type, shares_held: String(s.shares_held), ownership_pct: String(s.ownership_pct), as_of_date: s.as_of_date?.slice(0, 10) ?? BLANK.as_of_date, country: s.country ?? '' });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    const body = {
      name: form.name.trim(),
      type: form.type,
      shares_held: Number(form.shares_held) || 0,
      ownership_pct: Number(form.ownership_pct) || 0,
      as_of_date: form.as_of_date,
      country: form.country.trim() || undefined,
    };
    save.mutate({ id: editId ?? undefined, body }, { onSuccess: () => setOpen(false) });
  };

  // CSV bulk import: header row name,type,shares_held,ownership_pct,as_of_date,country
  const handleCsv = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const header = lines.shift()?.split(',').map((h) => h.trim().toLowerCase()) ?? [];
      const idx = (k: string) => header.indexOf(k);
      let ok = 0;
      for (const line of lines) {
        const c = line.split(',');
        const name = c[idx('name')]?.trim();
        if (!name) continue;
        await save.mutateAsync({
          body: {
            name,
            type: (c[idx('type')]?.trim() || 'institutional') as ShareholderType,
            shares_held: Number(c[idx('shares_held')]) || 0,
            ownership_pct: Number(c[idx('ownership_pct')]) || 0,
            as_of_date: c[idx('as_of_date')]?.trim() || BLANK.as_of_date,
            country: c[idx('country')]?.trim() || undefined,
          },
        }).then(() => { ok++; }).catch(() => undefined);
      }
      toast.success(`Imported ${ok} shareholder(s)`);
    } catch {
      toast.error('Could not parse CSV');
    } finally {
      setImporting(false);
    }
  };

  const columns: ColumnDef<Shareholder>[] = [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Holder" />, cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span> },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <Badge variant="outline" className="text-xs">{LABEL(row.original.type)}</Badge> },
    { accessorKey: 'shares_held', header: ({ column }) => <DataTableColumnHeader column={column} title="Shares" />, cell: ({ row }) => <span className="text-sm">{formatNumber(row.original.shares_held)}</span> },
    { accessorKey: 'ownership_pct', header: ({ column }) => <DataTableColumnHeader column={column} title="Ownership" />, cell: ({ row }) => <span className="text-sm font-medium">{Number(row.original.ownership_pct).toFixed(2)}%</span> },
    { accessorKey: 'country', header: 'Country', cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.country ?? '—'}</span> },
    { accessorKey: 'as_of_date', header: 'As of', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.as_of_date ? formatDate(row.original.as_of_date) : '—'}</span> },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(`Remove ${row.original.name}?`)) del.mutate(row.original.id); }}><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
        <Link href="/ir"><ArrowLeft className="mr-1 h-4 w-4" />Investor Relations</Link>
      </Button>
      <PageHeader
        title="Shareholders"
        description="Ownership register — institutional, retail and insider holders."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild disabled={importing}>
              <label className="cursor-pointer">
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Import CSV
                <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleCsv(f); e.target.value = ''; }} />
              </label>
            </Button>
            <Button size="sm" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add shareholder</Button>
          </div>
        }
      />
      <DataTable columns={columns} data={rows} isLoading={isLoading} searchColumn="name" searchPlaceholder="Search holders..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit shareholder' : 'Add shareholder'}</DialogTitle>
            <DialogDescription>Tip: use Import CSV for bulk uploads (columns: name, type, shares_held, ownership_pct, as_of_date, country).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ShareholderType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SHAREHOLDER_TYPES.map((t) => <SelectItem key={t} value={t}>{LABEL(t)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Shares</Label><Input type="number" value={form.shares_held} onChange={(e) => setForm({ ...form, shares_held: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Ownership %</Label><Input type="number" step="0.01" value={form.ownership_pct} onChange={(e) => setForm({ ...form, ownership_pct: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>As of</Label><Input type="date" value={form.as_of_date} onChange={(e) => setForm({ ...form, as_of_date: e.target.value })} /></div>
            </div>
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
