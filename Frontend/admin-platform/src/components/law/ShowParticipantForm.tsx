'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { normalizeError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PodcastPhotos } from '@/components/law/PodcastPhotos';
import { showParticipantsApi, type ShowParticipantRecord } from '@/lib/law/legal';

export function ShowParticipantForm({ item }: { item: ShowParticipantRecord }) {
  const qc = useQueryClient();
  const [v, setV] = useState<ShowParticipantRecord>(item);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof ShowParticipantRecord>(k: K, val: ShowParticipantRecord[K]) => { setSaved(false); setV((p) => ({ ...p, [k]: val })); };
  const words = (v.overview ?? '').trim().split(/\s+/).filter(Boolean).length;

  const save = useMutation({
    mutationFn: () => {
      const body: Partial<ShowParticipantRecord> = { ...v };
      delete (body as { id?: number }).id; delete body.updated_at; delete body.slug; delete body.show_slug;
      body.facts = (v.facts ?? []).filter((x) => x.label.trim() && x.value.trim());
      body.faq = (v.faq ?? []).filter((x) => x.q.trim() && x.a.trim());
      body.sources = (v.sources ?? []).filter((x) => x.label.trim() && x.url.trim());
      if (v.overview.trim()) body.reviewed_at = new Date().toISOString();
      for (const k of ['known_for', 'seo_title', 'seo_description'] as const) if (body[k] === '') body[k] = null;
      return showParticipantsApi.update(item.id, body);
    },
    onSuccess: () => { setError(null); setSaved(true); qc.invalidateQueries({ queryKey: ['law', 'show-people'] }); },
    onError: (e) => { setSaved(false); setError(normalizeError(e as AxiosError).message); },
  });

  return (
    <div className="space-y-6">
      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {saved && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved. The site picks it up within about a minute.</div>}
        <Card>
          <CardHeader><CardTitle>{v.name}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Page: /videos/shows/{v.show_slug}/people/{v.slug}. Seasons: {v.appearances.map((a) => `${a.season}${a.result ? ` (${a.result})` : ''}`).join(', ') || 'none'}.
            </p>
            <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" required value={v.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="kf">Known for (one line)</Label><Input id="kf" placeholder="e.g. Actor known for …" value={v.known_for ?? ''} onChange={(e) => set('known_for', e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="ov">Profile (your own words)</Label><Textarea id="ov" rows={12} value={v.overview} onChange={(e) => set('overview', e.target.value)} />
              <p className="text-xs text-muted-foreground">{words} words. Separate paragraphs with a blank line. Cover who they are, how they came to the show, what happened in their season and what they have done since, using only facts you can source. Under about 80 words, keep the page hidden from search.</p></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="st">Search title (optional)</Label><Input id="st" maxLength={200} value={v.seo_title ?? ''} onChange={(e) => set('seo_title', e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="sd">Search description (optional)</Label><Input id="sd" maxLength={320} value={v.seo_description ?? ''} onChange={(e) => set('seo_description', e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>At a glance</Label>
              {(v.facts ?? []).map((f, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-[1fr_2fr]">
                  <Input aria-label="Label" placeholder="e.g. Profession" value={f.label} onChange={(e) => set('facts', v.facts.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <Input aria-label="Value" placeholder="e.g. Actor" value={f.value} onChange={(e) => set('facts', v.facts.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => set('facts', [...(v.facts ?? []), { label: '', value: '' }])}>Add a fact</Button></div>
            <div className="space-y-2"><Label>Quick answers</Label>
              {(v.faq ?? []).map((f, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-2">
                  <Input aria-label="Question" placeholder="Question" value={f.q} onChange={(e) => set('faq', v.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                  <Input aria-label="Answer" placeholder="Answer" value={f.a} onChange={(e) => set('faq', v.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => set('faq', [...(v.faq ?? []), { q: '', a: '' }])}>Add a question</Button></div>
            <div className="space-y-2"><Label>Sources</Label>
              {(v.sources ?? []).map((x, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-2">
                  <Input aria-label="Source name" placeholder="Name" value={x.label} onChange={(e) => set('sources', v.sources.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)))} />
                  <Input aria-label="Source address" type="url" placeholder="https://" value={x.url} onChange={(e) => set('sources', v.sources.map((y, j) => (j === i ? { ...y, url: e.target.value } : y)))} />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => set('sources', [...(v.sources ?? []), { label: '', url: '' }])}>Add a source</Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {([['published', 'Published', 'The page is reachable and listed on season pages.'], ['indexable', 'Let search engines index its page', 'Turn on only when the profile is finished and checked.'], ['archived', 'Archived', 'Takes it offline without deleting it.']] as const).map(([k, l, d]) => (
              <div key={k} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={!!v[k]} onCheckedChange={(c) => set(k, c)} aria-label={l} /></div>
            ))}
          </CardContent>
        </Card>
        <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save changes'}</Button>
      </form>
      <PodcastPhotos entityType="show-participant" slug={`${v.show_slug}-${v.slug}`} suggestions={[v.name]} />
    </div>
  );
}
