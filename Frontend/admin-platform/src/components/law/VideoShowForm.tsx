'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { normalizeError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { REGION_NAMES, slugify, videoShowsApi, type VideoShowRecord } from '@/lib/law/legal';

const SELECT = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

export function VideoShowForm({ item }: { item?: VideoShowRecord }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = !item;
  const [v, setV] = useState<Partial<VideoShowRecord>>(item ?? { name: '', slug: '', description: '', scope: 'national', sort_order: 0, featured: false, published: false, archived: false });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof VideoShowRecord>(k: K, val: VideoShowRecord[K] | null) => { setSaved(false); setV((p) => ({ ...p, [k]: val })); };
  const text = (k: keyof VideoShowRecord) => (v[k] as string | null | undefined) ?? '';

  const save = useMutation({
    mutationFn: () => {
      const body: Partial<VideoShowRecord> = { ...v };
      delete (body as { id?: number }).id; delete body.updated_at;
      for (const k of ['country_code', 'network', 'cover_url', 'cover_credit'] as const) if (body[k] === '') body[k] = null;
      return isNew ? videoShowsApi.create(body) : videoShowsApi.update(item!.id, body);
    },
    onSuccess: (row) => { setError(null); setSaved(true); qc.invalidateQueries({ queryKey: ['law', 'video-shows'] }); if (isNew) router.replace(`/law/video-shows/${row.id}`); },
    onError: (e) => { setSaved(false); setError(normalizeError(e as AxiosError).message); },
  });

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved. The site picks it up within about a minute.</div>}
      <Card>
        <CardHeader><CardTitle>Show</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" required maxLength={200} value={text('name')} onChange={(e) => { set('name', e.target.value); if (isNew) set('slug', slugify(e.target.value)); }} /></div>
          <div className="space-y-1.5"><Label htmlFor="slug">Web address</Label><Input id="slug" required disabled={!isNew} value={text('slug')} onChange={(e) => set('slug', slugify(e.target.value))} /><p className="text-xs text-muted-foreground">/videos/shows/{text('slug') || 'your-show'}. Fixed once created.</p></div>
          <div className="space-y-1.5"><Label htmlFor="scope">Region</Label>
            <select id="scope" className={SELECT} value={v.scope ?? 'national'} onChange={(e) => set('scope', e.target.value as VideoShowRecord['scope'])}><option value="national">National</option><option value="international">International</option></select></div>
          <div className="space-y-1.5"><Label htmlFor="cc">Country</Label>
            <select id="cc" className={SELECT} disabled={v.scope === 'international'} value={v.country_code ?? ''} onChange={(e) => set('country_code', e.target.value || null)}>
              <option value="">Not specific to one country</option>{Object.entries(REGION_NAMES).filter(([c]) => c !== 'INTL').map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></div>
          <div className="space-y-1.5"><Label htmlFor="network">Network or channel (optional)</Label><Input id="network" value={text('network')} onChange={(e) => set('network', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="order">Order</Label><Input id="order" type="number" value={v.sort_order ?? 0} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} /><p className="text-xs text-muted-foreground">Lower numbers first.</p></div>
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="desc">Description</Label><Textarea id="desc" rows={3} value={text('description')} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="cover">Cover image address (optional)</Label><Input id="cover" type="url" placeholder="https://" value={text('cover_url')} onChange={(e) => set('cover_url', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="ccredit">Cover credit and licence</Label><Input id="ccredit" required={!!v.cover_url} value={text('cover_credit')} onChange={(e) => set('cover_credit', e.target.value)} /><p className="text-xs text-muted-foreground">Required with a cover. Only use images you have the right to show.</p></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {([['published', 'Published', 'Shown on /videos.'], ['featured', 'Featured', 'Prefer this show in highlighted spots.'], ['archived', 'Archived', 'Takes it offline without deleting it.']] as const).map(([k, l, d]) => (
            <div key={k} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={!!v[k]} onCheckedChange={(c) => set(k, c)} aria-label={l} /></div>
          ))}
        </CardContent>
      </Card>
      <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : isNew ? 'Create show' : 'Save changes'}</Button>
    </form>
  );
}
