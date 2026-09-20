'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Search } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/lib/store/uiStore';
import { useDebounced } from '@/lib/hooks/useDebounced';
import { sportsCompetitionsApi, COMPETITION_LEVELS, rowsOf, type SportsCompetitionRecord } from '@/lib/law/legal';

const SELECT = 'h-9 rounded-md border border-input bg-background px-3 text-sm';
const PAGE = 50;

export default function LawSportsCompetitionsPage() {
  const { setBreadcrumbs } = useUIStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search, 300);

  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Competitions' }]); }, [setBreadcrumbs]);
  useEffect(() => { setPage(1); }, [q, filter, state]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['law', 'sports-competitions', { q, filter, state, page }],
    queryFn: () => sportsCompetitionsApi.list({
      page, limit: PAGE,
      ...(q ? { search: q } : {}),
      ...(filter ? { level: filter } : {}),
      ...(state === 'published' ? { published: true } : {}),
      ...(state === 'draft' ? { published: false } : {}),
      ...(state === 'indexed' ? { indexable: true } : {}),
      ...(state === 'archived' ? { archived: true } : {}),
    }),
  });
  const rows = rowsOf<SportsCompetitionRecord>(data);
  const total = (data as { data?: { pagination?: { total?: number } } })?.data?.pagination?.total ?? rows.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Competitions" description="Competition profiles shown on lawelitenetwork.com under Sports → Competitions. Records here override the website’s built-in ones." actions={<Button asChild><Link href="/law/sports-competitions/new"><Plus className="mr-2 h-4 w-4" /> New competition</Link></Button>} />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name or slug…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
          </div>
          <select className={SELECT} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="level">
            <option value="">Any level</option>
            {COMPETITION_LEVELS.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select className={SELECT} value={state} onChange={(e) => setState(e.target.value)} aria-label="State">
            <option value="">Any state</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="indexed">Searchable by Google</option>
            <option value="archived">Archived</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : isError ? (
            <p className="py-16 text-center text-sm text-red-600">Could not load. Is law-service running and are you signed in as an admin?</p>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Nothing matches. The website shows its built-in entries for anything not listed here.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Sport</TableHead><TableHead>State</TableHead><TableHead className="text-right">Edit</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><div className="font-medium">{r.name}</div><div className="font-mono text-xs text-muted-foreground">/sports/competitions/{r.slug}</div></TableCell>
                    <TableCell className="text-muted-foreground">{r.sport}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.archived ? <Badge className="bg-gray-100 text-gray-600">Archived</Badge> : r.published ? <Badge className="bg-green-100 text-green-700">Published</Badge> : <Badge className="bg-amber-100 text-amber-700">Draft</Badge>}
                        {r.indexable && <Badge className="bg-blue-100 text-blue-700">Google</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right"><Button asChild variant="ghost" size="icon" aria-label={`Edit ${r.name}`}><Link href={`/law/sports-competitions/${r.id}`}><Pencil className="h-4 w-4" /></Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {total > PAGE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} records</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page * PAGE >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
