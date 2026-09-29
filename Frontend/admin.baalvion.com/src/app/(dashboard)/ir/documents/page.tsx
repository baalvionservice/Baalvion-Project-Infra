'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Plus, MoreHorizontal, Pencil, Trash2, ExternalLink, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import ReportUploadField from '@/components/ir/ReportUploadField';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDocuments, useSaveDocument, useDeleteDocument } from '@/lib/queries/ir-modules.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import { DOCUMENT_TYPES, LABEL, type IrDocument, type DocumentType } from '@/lib/types/ir-modules.types';

const CURRENT_YEAR = 2026;
const BLANK = { title: '', document_type: 'presentation' as DocumentType, description: '', file_url: null as string | null, year: String(CURRENT_YEAR), language: 'en', is_public: true };

export default function DocumentsPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading } = useDocuments({ page: 1, limit: 200 });
  const save = useSaveDocument();
  const del = useDeleteDocument();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);

  useEffect(() => { setBreadcrumbs([{ label: 'Investor Relations', href: '/ir' }, { label: 'Documents' }]); }, [setBreadcrumbs]);
  const rows = data?.items ?? [];

  const openNew = () => { setEditId(null); setForm(BLANK); setOpen(true); };
  const openEdit = (d: IrDocument) => {
    setEditId(d.id);
    setForm({ title: d.title, document_type: d.document_type, description: d.description ?? '', file_url: d.file_url, year: d.year ? String(d.year) : '', language: d.language ?? 'en', is_public: d.is_public });
    setOpen(true);
  };
  const submit = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.file_url) { toast.error('Please upload a file first'); return; }
    const body = {
      title: form.title.trim(), document_type: form.document_type, description: form.description.trim() || undefined,
      file_url: form.file_url, year: form.year ? Number(form.year) : undefined, language: form.language || 'en', is_public: form.is_public,
    };
    save.mutate({ id: editId ?? undefined, body }, { onSuccess: () => setOpen(false) });
  };

  const columns: ColumnDef<IrDocument>[] = [
    { accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Document" />, cell: ({ row }) => <span className="text-sm font-medium">{row.original.title}</span> },
    { accessorKey: 'document_type', header: 'Type', cell: ({ row }) => <Badge variant="outline" className="text-xs">{LABEL(row.original.document_type)}</Badge> },
    { accessorKey: 'year', header: 'Year', cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.year ?? '—'}</span> },
    { accessorKey: 'is_public', header: 'Visibility', cell: ({ row }) => row.original.is_public ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><Globe className="h-3 w-3" /> Public</span> : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Private</span> },
    { accessorKey: 'published_at', header: 'Published', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.published_at ? formatDate(row.original.published_at) : '—'}</span> },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            {row.original.file_url && <DropdownMenuItem asChild><a href={row.original.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Open</a></DropdownMenuItem>}
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
      <PageHeader title="Investor Documents" description="Presentations, fact sheets, prospectuses and the investor data-room." actions={<Button size="sm" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Upload document</Button>} />
      <DataTable columns={columns} data={rows} isLoading={isLoading} searchColumn="title" searchPlaceholder="Search documents..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit document' : 'Upload document'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1.5"><Label>Type</Label>
                <Select value={form.document_type} onValueChange={(v) => setForm({ ...form, document_type: v as DocumentType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOCUMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{LABEL(t)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Language</Label><Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>File</Label><ReportUploadField value={form.file_url} onChange={(url) => setForm({ ...form, file_url: url })} /></div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div><p className="text-sm font-medium">Public</p><p className="text-xs text-muted-foreground">Visible to investors on the website.</p></div>
              <Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} />
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
