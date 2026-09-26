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
import { PERSON_CATEGORIES, peopleApi, rowsOf, type PersonRecord } from '@/lib/law/people';

const SELECT = 'h-9 rounded-md border border-input bg-background px-3 text-sm';
const PAGE = 50;

export default function LawPeoplePage() {
  const { setBreadcrumbs } = useUIStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search, 300);

  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'People' }]); }, [setBreadcrumbs]);
  useEffect(() => { setPage(1); }, [q, category, state]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['law', 'people', { q, category, state, page }],
    queryFn: () => peopleApi.list({
      page, limit: PAGE,
      ...(q ? { search: q } : {}),
      ...(category ? { category } : {}),
      ...(state === 'published' ? { published: true } : {}),
      ...(state === 'draft' ? { published: false } : {}),
      ...(state === 'indexed' ? { indexable: true } : {}),
      ...(state === 'archived' ? { archived: true } : {}),
    }),
  });
  const rows = rowsOf<PersonRecord>(data);
  const total = (data as { data?: { pagination?: { total?: number } } })?.data?.pagination?.total ?? rows.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description="Public-figure profiles shown on lawelitenetwork.com. Profiles listed here override the website’s built-in ones."
        actions={<Button asChild><Link href="/law/people/new"><Plus className="mr-2 h-4 w-4" /> New profile</Link></Button>}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name or slug…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search people" />
          </div>
          <select className={SELECT} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {PERSON_CATEGORIES.map(([s, l]) => <option key={s} value={s}>{l}</option>)}
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
            <p className="py-16 text-center text-sm text-red-600">Could not load profiles. Is law-service running and are you signed in as an admin?</p>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No profiles match. The website shows its built-in roster for anyone not listed here.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>State</TableHead><TableHead className="text-right">Edit</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.display_name || r.full_name}</div>
                      <div className="font-mono text-xs text-muted-foreground">/people/{r.slug}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.category}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.archived ? <Badge className="bg-gray-100 text-gray-600">Archived</Badge>
                          : r.published ? <Badge className="bg-green-100 text-green-700">Published</Badge>
                          : <Badge className="bg-amber-100 text-amber-700">Draft</Badge>}
                        {r.indexable && <Badge className="bg-blue-100 text-blue-700">Google</Badge>}
                        {r.verified && <Badge className="bg-emerald-100 text-emerald-700">Reviewed</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon" aria-label={`Edit ${r.full_name}`}><Link href={`/law/people/${r.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {total > PAGE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} profiles</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page * PAGE >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
