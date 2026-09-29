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
import { rowsOf, podcastShowsApi, type PodcastShowRecord } from '@/lib/law/legal';

export default function PodcastsAdminPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Podcasts' }]); }, [setBreadcrumbs]);
  const { data, isLoading, isError } = useQuery({ queryKey: ['law', 'podcast-shows', 'all'], queryFn: () => podcastShowsApi.list({ page: 1, limit: 200 }) });
  const rows = rowsOf<PodcastShowRecord>(data);
  return (
    <div className="space-y-6">
      <PageHeader title="Podcasts" description="The list on the site's /podcasts page. Each country has its own Top 10: give a show a position from 1 to 10 within its country."
        actions={<Button asChild><Link href="/law/podcasts/new"><Plus className="mr-2 h-4 w-4" /> Add podcast</Link></Button>} />
      {isLoading ? <Skeleton className="h-40 w-full" /> : isError ? (
        <p className="rounded-lg border py-10 text-center text-sm text-red-600">Could not load. Is law-service running and are you signed in as an admin?</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">No podcasts yet. Press <span className="font-medium text-foreground">Add podcast</span>.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead className="w-20">Rank</TableHead><TableHead>Podcast</TableHead><TableHead>Country</TableHead><TableHead>State</TableHead><TableHead className="text-right">Edit</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.rank ?? '—'}</TableCell>
                <TableCell><div className="font-medium">{r.title}</div>{r.host && <div className="text-xs text-muted-foreground">{r.host}</div>}</TableCell>
                <TableCell className="text-muted-foreground">{r.country_code ?? '—'}</TableCell>
                <TableCell>{r.archived ? <Badge className="bg-gray-100 text-gray-600">Archived</Badge> : r.published ? <Badge className="bg-green-100 text-green-700">Live</Badge> : <Badge className="bg-amber-100 text-amber-700">Draft</Badge>}</TableCell>
                <TableCell className="text-right"><Button asChild variant="ghost" size="icon" aria-label={`Edit ${r.title}`}><Link href={`/law/podcasts/${r.id}`}><Pencil className="h-4 w-4" /></Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
