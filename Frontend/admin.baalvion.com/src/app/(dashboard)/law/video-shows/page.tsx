'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/lib/store/uiStore';
import { rowsOf, videoShowsApi, type VideoShowRecord } from '@/lib/law/legal';

export default function VideoShowsAdminPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Videos', href: '/law/videos' }, { label: 'Shows' }]); }, [setBreadcrumbs]);
  const { data, isLoading, isError } = useQuery({ queryKey: ['law', 'video-shows', 'all'], queryFn: () => videoShowsApi.list({ page: 1, limit: 200 }) });
  const rows = rowsOf<VideoShowRecord>(data);
  return (
    <div className="space-y-6">
      <PageHeader title="Shows" description="A show is a programme or series. Videos are filed under one."
        actions={<div className="flex gap-2"><Button variant="outline" asChild><Link href="/law/videos">Videos</Link></Button><Button asChild><Link href="/law/video-shows/new"><Plus className="mr-2 h-4 w-4" /> Add show</Link></Button></div>} />
      {isLoading ? <Skeleton className="h-40 w-full" /> : isError ? (
        <p className="rounded-lg border py-10 text-center text-sm text-red-600">Could not load. Is law-service running and are you signed in as an admin?</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">No shows yet. Press <span className="font-medium text-foreground">Add show</span>.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Show</TableHead><TableHead>Region</TableHead><TableHead>State</TableHead><TableHead className="text-right">Edit</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><div className="font-medium">{r.name}</div>{r.network && <div className="text-xs text-muted-foreground">{r.network}</div>}</TableCell>
                <TableCell className="text-muted-foreground">{r.scope === 'international' ? 'International' : `National${r.country_code ? ` · ${r.country_code}` : ''}`}</TableCell>
                <TableCell>{r.archived ? <Badge className="bg-gray-100 text-gray-600">Archived</Badge> : r.published ? <Badge className="bg-green-100 text-green-700">Live</Badge> : <Badge className="bg-amber-100 text-amber-700">Draft</Badge>}</TableCell>
                <TableCell className="text-right"><Button asChild variant="ghost" size="icon" aria-label={`Edit ${r.name}`}><Link href={`/law/video-shows/${r.id}`}><Pencil className="h-4 w-4" /></Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
