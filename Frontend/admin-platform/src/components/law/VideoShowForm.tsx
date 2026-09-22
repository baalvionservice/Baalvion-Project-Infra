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
import { REGION_NAMES, slugify, videoShowsApi, type ShowSeason, type VideoShowRecord } from '@/lib/law/legal';

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
      body.facts = (v.facts ?? []).filter((x) => x.label.trim() && x.value.trim());
      body.faq = (v.faq ?? []).filter((x) => x.q.trim() && x.a.trim());
      body.sources = (v.sources ?? []).filter((x) => x.label.trim() && x.url.trim());
      body.seasons = (v.seasons ?? []).filter((x) => Number.isFinite(x.number));
      if (String(v.overview ?? '').trim()) body.reviewed_at = new Date().toISOString();
      for (const k of ['country_code', 'network', 'cover_url', 'cover_credit', 'seo_title', 'seo_description'] as const) if (body[k] === '') body[k] = null;
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
        <CardHeader><CardTitle>Its own page</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="overview">Write-up</Label><Textarea id="overview" rows={10} value={v.overview ?? ''} onChange={(e) => set('overview', e.target.value)} />
            <p className="text-xs text-muted-foreground">{(v.overview ?? '').trim().split(/\s+/).filter(Boolean).length} words. Separate paragraphs with a blank line. Write it in your own words and only state facts you can check. Under about 80 words, keep the page hidden from search.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="st">Search title (optional)</Label><Input id="st" maxLength={200} value={text('seo_title')} onChange={(e) => set('seo_title', e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="sd">Search description (optional)</Label><Input id="sd" maxLength={320} value={text('seo_description')} onChange={(e) => set('seo_description', e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>At a glance (label and value)</Label>
            {(v.facts ?? []).map((f, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[1fr_2fr]">
                <Input aria-label="Label" placeholder="e.g. Host" value={f.label} onChange={(e) => set('facts', (v.facts ?? []).map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <Input aria-label="Value" placeholder="e.g. Salman Khan" value={f.value} onChange={(e) => set('facts', (v.facts ?? []).map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set('facts', [...(v.facts ?? []), { label: '', value: '' }])}>Add a fact</Button></div>
          <div className="space-y-2"><Label>Seasons and who took part</Label>
            {(v.seasons ?? []).map((sn, i) => {
              const upd = (patch: Partial<ShowSeason>) => set('seasons', (v.seasons ?? []).map((x, j) => (j === i ? { ...x, ...patch } : x)));
              return (
                <div key={i} className="space-y-2 rounded-md border p-3">
                  <div className="grid gap-2 md:grid-cols-4">
                    <Input aria-label="Season number" type="number" placeholder="Season no." value={sn.number ?? ''} onChange={(e) => upd({ number: Number(e.target.value) })} />
                    <Input aria-label="Year" type="number" placeholder="Year" value={sn.year ?? ''} onChange={(e) => upd({ year: e.target.value ? Number(e.target.value) : null })} />
                    <Input aria-label="Host" placeholder="Host" value={sn.host ?? ''} onChange={(e) => upd({ host: e.target.value })} />
                    <Input aria-label="Channel" placeholder="Channel" value={sn.network ?? ''} onChange={(e) => upd({ network: e.target.value })} />
                    <Input aria-label="Winner" placeholder="Winner" value={sn.winner ?? ''} onChange={(e) => upd({ winner: e.target.value })} />
                    <Input aria-label="Runner-up" placeholder="Runner-up" value={sn.runner_up ?? ''} onChange={(e) => upd({ runner_up: e.target.value })} />
                    <Input aria-label="Days" type="number" placeholder="Days" value={sn.days ?? ''} onChange={(e) => upd({ days: e.target.value ? Number(e.target.value) : null })} />
                    <Input aria-label="Housemates" type="number" placeholder="Housemates" value={sn.housemates ?? ''} onChange={(e) => upd({ housemates: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <Input aria-label="Notes" placeholder="Note about this season (optional)" value={sn.notes ?? ''} onChange={(e) => upd({ notes: e.target.value })} />
                  <Textarea aria-label="Participants" rows={5} placeholder={'One person per line, in the order they entered. After a name add | and a status, e.g. | Winner, | Runner-up, | Evicted day 21, | Walked out, | In the house.'}
                    value={(sn.participants ?? []).map((p) => (p.result ? `${p.name} | ${p.result}` : p.name)).join('\n')}
                    onChange={(e) => upd({ participants: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [name, result] = l.split('|').map((x) => x.trim()); return result ? { name, result } : { name }; }) })} />
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={() => set('seasons', [...(v.seasons ?? []), { number: (v.seasons?.length ?? 0) + 1, participants: [] }])}>Add a season</Button></div>
          <div className="space-y-2"><Label>Quick answers</Label>
            {(v.faq ?? []).map((f, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-2">
                <Input aria-label="Question" placeholder="Question" value={f.q} onChange={(e) => set('faq', (v.faq ?? []).map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                <Input aria-label="Answer" placeholder="Answer" value={f.a} onChange={(e) => set('faq', (v.faq ?? []).map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set('faq', [...(v.faq ?? []), { q: '', a: '' }])}>Add a question</Button></div>
          <div className="space-y-2"><Label>Sources</Label>
            {(v.sources ?? []).map((x, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-2">
                <Input aria-label="Source name" placeholder="Name" value={x.label} onChange={(e) => set('sources', (v.sources ?? []).map((y, j) => (j === i ? { ...y, label: e.target.value } : y)))} />
                <Input aria-label="Source address" type="url" placeholder="https://" value={x.url} onChange={(e) => set('sources', (v.sources ?? []).map((y, j) => (j === i ? { ...y, url: e.target.value } : y)))} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set('sources', [...(v.sources ?? []), { label: '', url: '' }])}>Add a source</Button></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {([['published', 'Published', 'Shown on /videos.'], ['indexable', 'Let search engines index its page', 'Turn on only when the write-up is finished and checked.'], ['featured', 'Featured', 'Prefer this show in highlighted spots.'], ['archived', 'Archived', 'Takes it offline without deleting it.']] as const).map(([k, l, d]) => (
            <div key={k} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={!!v[k]} onCheckedChange={(c) => set(k, c)} aria-label={l} /></div>
          ))}
        </CardContent>
      </Card>
      <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : isNew ? 'Create show' : 'Save changes'}</Button>
    </form>
  );
}
