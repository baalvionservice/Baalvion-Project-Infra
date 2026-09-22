'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { normalizeError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PHOTO_LICENSES, imagesApi, rowsOf, type CommonsCandidate, type EntityPhotoRecord } from '@/lib/law/images';

const SELECT = 'h-9 rounded-md border border-input bg-background px-3 text-sm';

function Thumb({ id, alt }: { id: number; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null; let live = true;
    imagesApi.blob(id).then((b) => { if (live) { url = URL.createObjectURL(b); setSrc(url); } }).catch(() => undefined);
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [id]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={alt} className="h-32 w-full rounded-md object-cover" /> : <div className="h-32 w-full animate-pulse rounded-md bg-muted" />;
}

/** Photos of one podcast: licensed uploads only, each with the credit that is printed under it on the page. */
export function PodcastPhotos({ slug, suggestions = [], entityType = 'podcast' }: { slug: string; suggestions?: string[]; entityType?: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [up, setUp] = useState({ credit: '', license: PHOTO_LICENSES[0] as string, source_url: '', alt_text: '' });
  const [q, setQ] = useState(suggestions[0] ?? '');
  const [found, setFound] = useState<CommonsCandidate[] | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const finder = useMutation({
    mutationFn: (term: string) => imagesApi.commonsSearch(term),
    onSuccess: (r) => { setError(null); setFound(r); },
    onError: (e) => setError(normalizeError(e as AxiosError).message),
  });
  const importer = useMutation({
    mutationFn: (c: CommonsCandidate) => imagesApi.commonsImport({ entity_type: entityType, entity_slug: slug, title: c.title }).then(() => c.title),
    onSuccess: (title) => { setError(null); setAdded((a) => new Set(a).add(title)); qc.invalidateQueries({ queryKey: ['law', 'images'] }); },
    onError: (e) => setError(normalizeError(e as AxiosError).message),
  });
  const key = ['law', 'images', entityType, slug];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => imagesApi.list({ page: 1, limit: 100, entity_type: entityType, entity_slug: slug }) });
  const rows = rowsOf<EntityPhotoRecord>(data);
  const refresh = () => qc.invalidateQueries({ queryKey: ['law', 'images'] });
  const fail = (e: unknown) => setError(e instanceof Error && !('response' in e) ? e.message : normalizeError(e as AxiosError).message);

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
      form.append('entity_type', entityType);
      form.append('entity_slug', slug);
      Object.entries(up).forEach(([k, v]) => { if (v) form.append(k, v); });
      return imagesApi.upload(form);
    },
    onSuccess: () => { setError(null); setUp((u) => ({ ...u, credit: '', source_url: '', alt_text: '' })); if (fileRef.current) fileRef.current.value = ''; refresh(); },
    onError: fail,
  });

  return (
    <Card>
      <CardHeader><CardTitle>Photos</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">Find free photos</p>
          <div className="flex flex-wrap gap-2">
            <Input className="w-72" placeholder="Search a person or show, e.g. Michael Barbaro" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (q.trim().length > 1) finder.mutate(q.trim()); } }} aria-label="Search Wikimedia Commons" />
            <Button type="button" size="sm" disabled={finder.isPending || q.trim().length < 2} onClick={() => finder.mutate(q.trim())}>{finder.isPending ? 'Searching…' : 'Search'}</Button>
            {suggestions.filter((x) => x && x !== q).slice(0, 5).map((x) => <Button key={x} type="button" size="sm" variant="ghost" onClick={() => { setQ(x); finder.mutate(x); }}>{x}</Button>)}
          </div>
          <p className="text-xs text-muted-foreground">Searches Wikimedia Commons and lists only photos whose licence allows use here (public domain, CC0, CC BY, CC BY-SA). Adding one saves it with the photographer's credit and the licence, exactly as Commons records them. Check it really shows the right person before you add it.</p>
          {found && (found.length === 0 ? <p className="text-sm text-muted-foreground">No freely licensed photos found. Try a different spelling, or upload your own below.</p> : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {found.map((c) => (
                <div key={c.title} className={`space-y-1.5 rounded-lg border p-2 ${c.recommended ? 'border-green-500 ring-1 ring-green-500' : ''}`}>
                  {c.recommended && <Badge className="bg-green-100 text-green-700">Recommended portrait</Badge>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.thumb} alt={c.description || c.title} loading="lazy" referrerPolicy="no-referrer" className="h-28 w-full rounded-md object-cover object-top" />
                  <p className="line-clamp-2 text-[11px] text-muted-foreground" title={c.title}>{c.title.replace(/^File:/, '')}</p>
                  <p className="truncate text-[11px] text-muted-foreground" title={c.credit}>{c.credit} · {c.license}</p>
                  <div className="flex items-center gap-2">
                    {added.has(c.title) ? <Badge className="bg-green-100 text-green-700">Added</Badge> : <Button type="button" size="sm" variant="outline" disabled={importer.isPending} onClick={() => importer.mutate(c)}>Add</Button>}
                    {c.source_url && <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-700 underline">Details</a>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">Or upload your own</p>
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" aria-label="Image file" />
            <select className={SELECT} value={up.license} onChange={(e) => setUp({ ...up, license: e.target.value })} aria-label="Licence">{PHOTO_LICENSES.map((l) => <option key={l}>{l}</option>)}</select>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Input placeholder="Credit, e.g. Jane Doe / Wikimedia Commons" value={up.credit} onChange={(e) => setUp({ ...up, credit: e.target.value })} aria-label="Credit" />
            <Input placeholder="Describe the photo (for screen readers)" value={up.alt_text} onChange={(e) => setUp({ ...up, alt_text: e.target.value })} aria-label="Description" />
            <Input type="url" placeholder="Source address (optional)" value={up.source_url} onChange={(e) => setUp({ ...up, source_url: e.target.value })} aria-label="Source address" />
          </div>
          <Button type="button" size="sm" disabled={upload.isPending || !up.credit.trim()} onClick={() => upload.mutate()}>{upload.isPending ? 'Uploading…' : 'Upload photo'}</Button>
          <p className="text-xs text-muted-foreground">Only photos you own or that carry a free licence. Never cover art, screenshots, or pictures copied from Google or social media. The first photo becomes the main one; the credit is printed under it.</p>
        </div>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">No photos yet. Until one is added, the site shows a plain text tile.</p> : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {rows.map((r) => (
              <div key={r.id} className={`space-y-2 rounded-lg border p-2 ${r.is_active ? '' : 'opacity-50'}`}>
                <Thumb id={r.id} alt={r.alt_text || slug} />
                <p className="truncate text-[11px] text-muted-foreground" title={r.credit}>{r.credit} · {r.license}</p>
                <div className="flex flex-wrap items-center gap-1">
                  {r.is_primary && <Badge className="bg-green-100 text-green-700">Main</Badge>}
                  {!r.is_primary && r.is_active && <Button type="button" size="sm" variant="outline" onClick={() => patch.mutate({ id: r.id, body: { is_primary: true } })}>Make main</Button>}
                  <Button type="button" size="sm" variant="ghost" onClick={() => patch.mutate({ id: r.id, body: r.is_active ? { is_active: false, is_primary: false } : { is_active: true } })}>{r.is_active ? 'Turn off' : 'Turn on'}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
