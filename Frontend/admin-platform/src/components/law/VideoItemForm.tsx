'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { normalizeError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { REGION_NAMES, rowsOf, slugify, videoItemsApi, videoShowsApi, type VideoItemRecord, type VideoShowRecord } from '@/lib/law/legal';

const SELECT = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';
const toLocal = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
const fromLocal = (x: string) => (x ? new Date(x).toISOString() : null);

export function VideoItemForm({ item }: { item?: VideoItemRecord }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = !item;
  const [v, setV] = useState<Partial<VideoItemRecord>>(item ?? { title: '', slug: '', description: '', video_url: '', scope: 'national', people_slugs: [], sort_order: 0, featured: false, published: false, archived: false, published_at: new Date().toISOString() });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const shows = useQuery({ queryKey: ['law', 'video-shows', 'options'], queryFn: () => videoShowsApi.list({ page: 1, limit: 200, archived: false }) });
  const showOptions = rowsOf<VideoShowRecord>(shows.data);
  const set = <K extends keyof VideoItemRecord>(k: K, val: VideoItemRecord[K] | null) => { setSaved(false); setV((p) => ({ ...p, [k]: val })); };
  const text = (k: keyof VideoItemRecord) => (v[k] as string | null | undefined) ?? '';

  const save = useMutation({
    mutationFn: () => {
      const body: Partial<VideoItemRecord> = { ...v };
      delete (body as { id?: number }).id; delete body.updated_at;
      for (const k of ['country_code', 'source_name', 'thumbnail_url', 'thumbnail_credit', 'show_slug', 'category'] as const) if (body[k] === '') body[k] = null;
      if (body.duration_seconds === ('' as unknown)) body.duration_seconds = null;
      return isNew ? videoItemsApi.create(body) : videoItemsApi.update(item!.id, body);
    },
    onSuccess: (row) => { setError(null); setSaved(true); qc.invalidateQueries({ queryKey: ['law', 'video-items'] }); if (isNew) router.replace(`/law/videos/${row.id}`); },
    onError: (e) => { setSaved(false); setError(normalizeError(e as AxiosError).message); },
  });

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved. The site picks it up within about a minute.</div>}
      <Card>
        <CardHeader><CardTitle>Video</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="title">Title</Label><Input id="title" required maxLength={300} value={text('title')} onChange={(e) => { set('title', e.target.value); if (isNew) set('slug', slugify(e.target.value).slice(0, 80)); }} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="url">Video address</Label><Input id="url" type="url" required placeholder="https://www.youtube.com/watch?v=…" value={text('video_url')} onChange={(e) => set('video_url', e.target.value)} /><p className="text-xs text-muted-foreground">YouTube and Vimeo play on the page. Any other https address opens on its own site. Only link to videos you are allowed to show.</p></div>
          <div className="space-y-1.5"><Label htmlFor="slug">Web address</Label><Input id="slug" required disabled={!isNew} value={text('slug')} onChange={(e) => set('slug', slugify(e.target.value))} /><p className="text-xs text-muted-foreground">/videos/{text('slug') || 'your-video'}. Fixed once created.</p></div>
          <div className="space-y-1.5"><Label htmlFor="show">Show</Label>
            <select id="show" className={SELECT} value={v.show_slug ?? ''} onChange={(e) => set('show_slug', e.target.value || null)}><option value="">Not part of a show</option>{showOptions.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></div>
          <div className="space-y-1.5"><Label htmlFor="category">Section (optional)</Label><Input id="category" maxLength={60} placeholder="e.g. Celebrity, Sports, Courtroom" value={text('category')} onChange={(e) => set('category', e.target.value)} /><p className="text-xs text-muted-foreground">Videos with no show are grouped under this heading.</p></div>
          <div className="space-y-1.5"><Label htmlFor="source">Source or channel (optional)</Label><Input id="source" value={text('source_name')} onChange={(e) => set('source_name', e.target.value)} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="desc">Description (your own words)</Label><Textarea id="desc" rows={4} value={text('description')} onChange={(e) => set('description', e.target.value)} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Region, thumbnail and timing</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="scope">Region</Label>
            <select id="scope" className={SELECT} value={v.scope ?? 'national'} onChange={(e) => set('scope', e.target.value as VideoItemRecord['scope'])}><option value="national">National</option><option value="international">International</option></select></div>
          <div className="space-y-1.5"><Label htmlFor="cc">Country</Label>
            <select id="cc" className={SELECT} disabled={v.scope === 'international'} value={v.country_code ?? ''} onChange={(e) => set('country_code', e.target.value || null)}>
              <option value="">Not specific to one country</option>{Object.entries(REGION_NAMES).filter(([c]) => c !== 'INTL').map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></div>
          <div className="space-y-1.5"><Label htmlFor="thumb">Thumbnail address (optional)</Label><Input id="thumb" type="url" placeholder="https://" value={text('thumbnail_url')} onChange={(e) => set('thumbnail_url', e.target.value)} /><p className="text-xs text-muted-foreground">Left empty, YouTube videos use their own poster frame.</p></div>
          <div className="space-y-1.5"><Label htmlFor="tcredit">Thumbnail credit</Label><Input id="tcredit" required={!!v.thumbnail_url} value={text('thumbnail_credit')} onChange={(e) => set('thumbnail_credit', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="when">Published on</Label><Input id="when" type="datetime-local" value={toLocal(v.published_at)} onChange={(e) => set('published_at', fromLocal(e.target.value))} /></div>
          <div className="space-y-1.5"><Label htmlFor="dur">Length in seconds (optional)</Label><Input id="dur" type="number" min={0} value={v.duration_seconds ?? ''} onChange={(e) => set('duration_seconds', e.target.value === '' ? null : Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label htmlFor="order">Order</Label><Input id="order" type="number" value={v.sort_order ?? 0} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {([['published', 'Published', 'Shown on /videos.'], ['featured', 'Featured', 'Eligible for the big player at the top of /videos.'], ['archived', 'Archived', 'Takes it offline without deleting it.']] as const).map(([k, l, d]) => (
            <div key={k} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={!!v[k]} onCheckedChange={(c) => set(k, c)} aria-label={l} /></div>
          ))}
        </CardContent>
      </Card>
      <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : isNew ? 'Create video' : 'Save changes'}</Button>
    </form>
  );
}
