'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { Search } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeError } from '@/lib/api/client';
import { useUIStore } from '@/lib/store/uiStore';
import { useDebounced } from '@/lib/hooks/useDebounced';
import { IMAGE_ENTITY_TYPES, PHOTO_LICENSES, imagesApi, rowsOf, type EntityPhotoRecord } from '@/lib/law/images';

const SELECT = 'h-9 rounded-md border border-input bg-background px-3 text-sm';
const PAGE = 48;

/** Fetched with the staff token (the public route only serves active photos), shown from an object URL. */
function Thumb({ id, alt }: { id: number; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    imagesApi.blob(id).then((b) => { if (!cancelled) { url = URL.createObjectURL(b); setSrc(url); } }).catch(() => {});
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [id]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={alt} loading="lazy" className="h-36 w-full rounded-md object-cover object-top" /> : <div className="h-36 w-full animate-pulse rounded-md bg-muted" />;
}

export default function LawImagesPage() {
  const { setBreadcrumbs } = useUIStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [up, setUp] = useState({ entity_type: 'person', entity_slug: '', credit: '', license: PHOTO_LICENSES[0] as string, source_url: '' });
  const q = useDebounced(search, 300);

  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Images' }]); }, [setBreadcrumbs]);
  useEffect(() => { setPage(1); }, [q, type, state]);

  const key = ['law', 'images', { q, type, state, page }];
  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => imagesApi.list({
      page, limit: PAGE, ...(q ? { search: q } : {}), ...(type ? { entity_type: type } : {}),
      ...(state === 'primary' ? { is_primary: true } : {}), ...(state === 'inactive' ? { is_active: false } : {}),
    }),
  });
  const rows = rowsOf<EntityPhotoRecord>(data);
  const total = (data as { data?: { pagination?: { total?: number } } })?.data?.pagination?.total ?? rows.length;
  const refresh = () => qc.invalidateQueries({ queryKey: ['law', 'images'] });
  const fail = (e: unknown) => setError(normalizeError(e as AxiosError).message);

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<EntityPhotoRecord> }) => imagesApi.update(id, body),
    onSuccess: () => { setError(null); refresh(); }, onError: fail,
  });
  const upload = useMutation({
    mutationFn: () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error('Choose an image file first');
      const form = new FormData();
      form.append('file', file);
      Object.entries(up).forEach(([k, v]) => { if (v) form.append(k, v); });
      return imagesApi.upload(form);
    },
    onSuccess: () => { setError(null); setUp((u) => ({ ...u, entity_slug: '', credit: '', source_url: '' })); if (fileRef.current) fileRef.current.value = ''; refresh(); },
    onError: (e) => setError(e instanceof Error && !('response' in e) ? e.message : normalizeError(e as AxiosError).message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Images" description="Photos for people, films, teams and courts. Only images LEN owns or that carry a free licence (public domain, CC0, CC BY, CC BY-SA). The credit is shown on the page." />
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Add or replace an image</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); upload.mutate(); }}>
            <div className="flex flex-wrap gap-2">
              <select className={SELECT} value={up.entity_type} onChange={(e) => setUp({ ...up, entity_type: e.target.value })} aria-label="Type">{IMAGE_ENTITY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <Input className="w-64" placeholder="Slug, e.g. tom-hanks" value={up.entity_slug} onChange={(e) => setUp({ ...up, entity_slug: e.target.value.trim() })} aria-label="Slug" />
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" aria-label="Image file" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Input className="w-72" placeholder="Credit, e.g. Jane Doe / Wikimedia Commons" value={up.credit} onChange={(e) => setUp({ ...up, credit: e.target.value })} aria-label="Credit" />
              <select className={SELECT} value={up.license} onChange={(e) => setUp({ ...up, license: e.target.value })} aria-label="Licence">{PHOTO_LICENSES.map((l) => <option key={l}>{l}</option>)}</select>
              <Input className="w-72" placeholder="Source URL (optional)" value={up.source_url} onChange={(e) => setUp({ ...up, source_url: e.target.value })} aria-label="Source URL" />
            </div>
            <Button type="submit" size="sm" disabled={upload.isPending || !up.entity_slug || !up.credit.trim()}>{upload.isPending ? 'Uploading…' : 'Upload'}</Button>
            <p className="text-xs text-muted-foreground">The first image for an entity becomes its main image; uploading another does not replace it until you choose “Make main”. Never upload posters, album art or images copied from Google or social media.</p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search slug or credit…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search images" /></div>
          <select className={SELECT} value={type} onChange={(e) => setType(e.target.value)} aria-label="Type filter"><option value="">All types</option>{IMAGE_ENTITY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <select className={SELECT} value={state} onChange={(e) => setState(e.target.value)} aria-label="State filter"><option value="">Any state</option><option value="primary">Main images</option><option value="inactive">Turned off</option></select>
        </CardContent>
      </Card>

      {isLoading ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}</div>
        : isError ? <p className="py-12 text-center text-sm text-red-600">Could not load images. Is law-service running and are you signed in as an admin?</p>
        : rows.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No images match.</p>
        : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {rows.map((r) => (
              <div key={r.id} className={`space-y-2 rounded-lg border p-2 ${r.is_active ? '' : 'opacity-50'}`}>
                <Thumb id={r.id} alt={r.alt_text || r.entity_slug} />
                <div>
                  <p className="truncate font-mono text-xs font-semibold" title={r.entity_slug}>{r.entity_slug}</p>
                  <p className="text-[11px] text-muted-foreground">{r.entity_type} · {r.license}</p>
                  <p className="truncate text-[11px] text-muted-foreground" title={r.credit}>{r.credit}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {r.is_primary && <Badge className="bg-green-100 text-green-700">Main</Badge>}
                  {!r.is_primary && r.is_active && <Button size="sm" variant="outline" onClick={() => patch.mutate({ id: r.id, body: { is_primary: true } })}>Make main</Button>}
                  <Button size="sm" variant="ghost" onClick={() => patch.mutate({ id: r.id, body: r.is_active ? { is_active: false, is_primary: false } : { is_active: true } })}>{r.is_active ? 'Turn off' : 'Turn on'}</Button>
                </div>
              </div>
            ))}
          </div>
        )}

      {total > PAGE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} images</span>
          <div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page * PAGE >= total} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
        </div>
      )}
    </div>
  );
}
