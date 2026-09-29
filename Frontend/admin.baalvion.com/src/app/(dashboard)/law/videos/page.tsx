'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Search } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/lib/store/uiStore';
import { useDebounced } from '@/lib/hooks/useDebounced';
import { rowsOf, videoItemsApi, videoShowsApi, type VideoItemRecord, type VideoShowRecord } from '@/lib/law/legal';

const SELECT = 'h-9 rounded-md border border-input bg-background px-3 text-sm';
const state = (r: { published: boolean; archived: boolean }) =>
  r.archived ? <Badge className="bg-gray-100 text-gray-600">Archived</Badge> : r.published ? <Badge className="bg-green-100 text-green-700">Live</Badge> : <Badge className="bg-amber-100 text-amber-700">Draft</Badge>;

export default function VideosAdminPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Videos' }]); }, [setBreadcrumbs]);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('');
  const [show, setShow] = useState('');
  const [status, setStatus] = useState('');
  const q = useDebounced(search, 300);
  const params = {
    page: 1, limit: 100, ...(q ? { search: q } : {}), ...(scope ? { scope } : {}), ...(show ? { show_slug: show } : {}),
    ...(status === 'live' ? { published: true, archived: false } : {}), ...(status === 'draft' ? { published: false, archived: false } : {}), ...(status === 'archived' ? { archived: true } : {}),
  };
  const videos = useQuery({ queryKey: ['law', 'video-items', params], queryFn: () => videoItemsApi.list(params) });
  const shows = useQuery({ queryKey: ['law', 'video-shows', 'options'], queryFn: () => videoShowsApi.list({ page: 1, limit: 200 }) });
  const rows = rowsOf<VideoItemRecord>(videos.data);
  const showRows = rowsOf<VideoShowRecord>(shows.data);
  const nameOf = (slug?: string | null) => showRows.find((s) => s.slug === slug)?.name ?? slug ?? '—';

  return (
    <div className="space-y-6">
      <PageHeader title="Videos" description="Shows and videos for the site's /videos page: national and international."
        actions={<div className="flex gap-2"><Button variant="outline" asChild><Link href="/law/video-shows">Manage shows</Link></Button><Button asChild><Link href="/law/videos/new"><Plus className="mr-2 h-4 w-4" /> Add video</Link></Button></div>} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search title or source…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" /></div>
        <select className={SELECT} value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Region"><option value="">National + international</option><option value="national">National</option><option value="international">International</option></select>
        <select className={SELECT} value={show} onChange={(e) => setShow(e.target.value)} aria-label="Show"><option value="">Any show</option>{showRows.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select>
        <select className={SELECT} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="State"><option value="">Any state</option><option value="live">Live</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
      </div>
      {videos.isLoading ? <Skeleton className="h-40 w-full" /> : videos.isError ? (
        <p className="rounded-lg border py-10 text-center text-sm text-red-600">Could not load. Is law-service running and are you signed in as an admin?</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">No videos yet. Create a show, then press <span className="font-medium text-foreground">Add video</span>.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Video</TableHead><TableHead>Show</TableHead><TableHead>Region</TableHead><TableHead>State</TableHead><TableHead className="text-right">Edit</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><div className="font-medium">{r.title}{r.featured && <Badge className="ml-2 bg-red-100 text-red-700">Featured</Badge>}</div>{r.source_name && <div className="text-xs text-muted-foreground">{r.source_name}</div>}</TableCell>
                <TableCell className="text-muted-foreground">{nameOf(r.show_slug)}</TableCell>
                <TableCell className="text-muted-foreground">{r.scope === 'international' ? 'International' : `National${r.country_code ? ` · ${r.country_code}` : ''}`}</TableCell>
                <TableCell>{state(r)}</TableCell>
                <TableCell className="text-right"><Button asChild variant="ghost" size="icon" aria-label={`Edit ${r.title}`}><Link href={`/law/videos/${r.id}`}><Pencil className="h-4 w-4" /></Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
