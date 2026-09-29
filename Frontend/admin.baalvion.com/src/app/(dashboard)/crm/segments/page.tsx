'use client';

import { useEffect, useState } from 'react';
import { Layers, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
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
import {
  useSegments,
  useCreateSegment,
  useUpdateSegment,
  useDeleteSegment,
} from '@/lib/queries/crm.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { formatMoney, formatNumber } from '@/lib/utils/format';
import type { Segment, SegmentPayload } from '@/lib/types/crm.types';

interface SegmentForm {
  name: string;
  description: string;
  userCount: string;
  avgOrderValue: string;
  tags: string;
  predictedChurn: string;
}

const defaultForm: SegmentForm = {
  name: '',
  description: '',
  userCount: '',
  avgOrderValue: '',
  tags: '',
  predictedChurn: '',
};

function churnVariant(c: number): 'success' | 'warning' | 'destructive' {
  if (c >= 0.5) return 'destructive';
  if (c >= 0.25) return 'warning';
  return 'success';
}

export default function SegmentsPage() {
  const { setBreadcrumbs } = useUIStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Segment | null>(null);
  const [form, setForm] = useState<SegmentForm>(defaultForm);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useSegments({ page, limit: 20, search: debouncedSearch || undefined });
  const createSegment = useCreateSegment();
  const updateSegment = useUpdateSegment();
  const deleteSegment = useDeleteSegment();

  useEffect(() => {
    setBreadcrumbs([{ label: 'CRM & Marketing', href: '/crm' }, { label: 'Segments' }]);
  }, [setBreadcrumbs]);

  const segments = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (s: Segment) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? '',
      userCount: s.userCount != null ? String(s.userCount) : '',
      avgOrderValue: s.avgOrderValue != null ? String(s.avgOrderValue) : '',
      tags: (s.tags ?? []).join(', '),
      predictedChurn: s.predictedChurn != null ? String(s.predictedChurn) : '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: SegmentPayload = {
      name: form.name,
      description: form.description || undefined,
      userCount: form.userCount ? Number(form.userCount) : undefined,
      avgOrderValue: form.avgOrderValue ? Number(form.avgOrderValue) : undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      predictedChurn: form.predictedChurn ? Number(form.predictedChurn) : undefined,
    };
    if (editing) {
      updateSegment.mutate({ id: editing.id, payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createSegment.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Segments"
        description={`${total} audience segments`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Segment
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search segments..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : segments.length === 0 ? (
            <div className="py-16 text-center">
              <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No segments yet</p>
              <Button size="sm" onClick={openCreate}>Add Segment</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Avg Order</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Predicted Churn</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{s.name}</p>
                      {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{formatNumber(s.userCount ?? 0)}</TableCell>
                    <TableCell className="text-sm font-medium">{formatMoney(s.avgOrderValue ?? 0)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(s.tags ?? []).slice(0, 3).map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={churnVariant(s.predictedChurn ?? 0)} className="text-xs">
                        {Math.round((s.predictedChurn ?? 0) * 100)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteSegment.mutate(s.id)}
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
            <DialogTitle>{editing ? 'Edit Segment' : 'New Segment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Segment name" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>User Count</Label>
                <Input type="number" value={form.userCount} onChange={(e) => setForm((f) => ({ ...f, userCount: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Avg Order Value</Label>
                <Input type="number" value={form.avgOrderValue} onChange={(e) => setForm((f) => ({ ...f, avgOrderValue: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="luxury, repeat, high-value" />
            </div>
            <div className="space-y-1.5">
              <Label>Predicted Churn (0–1)</Label>
              <Input type="number" step="0.01" min="0" max="1" value={form.predictedChurn} onChange={(e) => setForm((f) => ({ ...f, predictedChurn: e.target.value }))} placeholder="0.15" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name.trim() || createSegment.isPending || updateSegment.isPending}
            >
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
