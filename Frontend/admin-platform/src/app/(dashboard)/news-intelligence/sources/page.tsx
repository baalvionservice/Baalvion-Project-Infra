'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients } from '@/lib/api/client';
import type { NewsCategory, NewsSource, NewsSourceType } from '@/lib/types/news.types';

const CATEGORIES: NewsCategory[] = ['AI', 'Technology', 'Business', 'Finance', 'Startups', 'Cybersecurity', 'World', 'Science'];
const TYPES: NewsSourceType[] = ['rss', 'press_release', 'government'];

export default function NewsSourcesPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'News Intelligence', href: '/news-intelligence' }, { label: 'Sources' }]); }, [setBreadcrumbs]);

  const qc = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', feed_url: '', type: 'rss' as NewsSourceType, default_category: 'World' as NewsCategory, country: '' });

  const { data: sources, isLoading } = useQuery({
    queryKey: ['news', 'sources'],
    queryFn: () => serviceClients.news.get('/sources').then((r) => r.data.data as NewsSource[]),
  });

  const createSource = useMutation({
    mutationFn: () => serviceClients.news.post('/sources', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news', 'sources'] });
      setIsDialogOpen(false);
      setForm({ name: '', feed_url: '', type: 'rss', default_category: 'World', country: '' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      serviceClients.news.patch(`/sources/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['news', 'sources'] }),
  });

  const removeSource = useMutation({
    mutationFn: (id: string) => serviceClients.news.delete(`/sources/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['news', 'sources'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sources"
        description="RSS / government feed registry that the ingestion worker polls"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add source</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add source</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="src-name">Name</Label>
                  <Input id="src-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="src-url">Feed URL</Label>
                  <Input id="src-url" value={form.feed_url} onChange={(e) => setForm((f) => ({ ...f, feed_url: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as NewsSourceType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={form.default_category} onValueChange={(v) => setForm((f) => ({ ...f, default_category: v as NewsCategory }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="src-country">Country (2-letter, optional)</Label>
                  <Input id="src-country" maxLength={2} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => createSource.mutate()} disabled={!form.name || !form.feed_url || createSource.isPending}>
                  {createSource.isPending ? 'Adding…' : 'Add source'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !sources || sources.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No sources registered.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Poll interval</TableHead>
                  <TableHead>Last polled</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div className="font-medium">{source.name}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-xs">{source.feed_url}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{source.type}</Badge></TableCell>
                    <TableCell>{source.default_category}</TableCell>
                    <TableCell>{source.poll_interval_minutes}m</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {source.last_polled_at ? new Date(source.last_polled_at).toLocaleString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={source.is_active}
                        onCheckedChange={(checked) => toggleActive.mutate({ id: source.id, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => removeSource.mutate(source.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
