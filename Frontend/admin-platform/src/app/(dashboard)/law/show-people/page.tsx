'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Search } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/lib/store/uiStore';
import { useDebounced } from '@/lib/hooks/useDebounced';
import { rowsOf, showParticipantsApi, type ShowParticipantRecord } from '@/lib/law/legal';

const SELECT = 'h-9 rounded-md border border-input bg-background px-3 text-sm';
const PAGE = 50;

export default function ShowPeopleAdminPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Show people' }]); }, [setBreadcrumbs]);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search, 300);
  useEffect(() => { setPage(1); }, [q, state]);
  const params = {
    page, limit: PAGE, ...(q ? { search: q } : {}),
    ...(state === 'written' ? { indexable: true } : {}), ...(state === 'unwritten' ? { indexable: false } : {}), ...(state === 'archived' ? { archived: true } : {}),
  };
  const { data, isLoading, isError } = useQuery({ queryKey: ['law', 'show-people', params], queryFn: () => showParticipantsApi.list(params) });
  const rows = rowsOf<ShowParticipantRecord>(data);
  const total = (data as { data?: { pagination?: { total?: number } } })?.data?.pagination?.total ?? rows.length;
  return (
    <div className="space-y-6">
      <PageHeader title="Show people" description="Everyone who took part in a show, such as Bigg Boss housemates. Open one to write their profile, add photos and switch on search indexing." />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search a name…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" /></div>
        <select className={SELECT} value={state} onChange={(e) => setState(e.target.value)} aria-label="State"><option value="">Everyone</option><option value="written">Profile live in search</option><option value="unwritten">Still to write</option><option value="archived">Archived</option></select>
      </div>
      {isLoading ? <Skeleton className="h-40 w-full" /> : isError ? (
        <p className="rounded-lg border py-10 text-center text-sm text-red-600">Could not load. Is law-service running and are you signed in as an admin?</p>
      ) : rows.length === 0 ? <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">No one matches.</p> : (
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Seasons</TableHead><TableHead>Profile</TableHead><TableHead className="text-right">Edit</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.show_slug}</div></TableCell>
                <TableCell className="text-muted-foreground">{r.appearances.map((a) => a.season + (a.result === 'Winner' ? ' (winner)' : a.result === 'Runner-up' ? ' (runner-up)' : '')).join(', ')}</TableCell>
                <TableCell>{r.archived ? <Badge className="bg-gray-100 text-gray-600">Archived</Badge> : r.indexable ? <Badge className="bg-green-100 text-green-700">Live in search</Badge> : r.overview ? <Badge className="bg-amber-100 text-amber-700">Written, not indexed</Badge> : <Badge className="bg-gray-100 text-gray-600">Not written</Badge>}</TableCell>
                <TableCell className="text-right"><Button asChild variant="ghost" size="icon" aria-label={`Edit ${r.name}`}><Link href={`/law/show-people/${r.id}`}><Pencil className="h-4 w-4" /></Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {total > PAGE && <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{total} people</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page * PAGE >= total} onClick={() => setPage((p) => p + 1)}>Next</Button></div></div>}
    </div>
  );
}
