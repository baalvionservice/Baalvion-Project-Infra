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
import { PodcastPhotos } from '@/components/law/PodcastPhotos';
import { REGION_NAMES, podcastShowsApi, slugify, type PodcastShowRecord } from '@/lib/law/legal';

const SELECT = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';
const NULLABLE = ['host', 'publisher', 'category', 'country_code', 'language', 'listen_url', 'website_url', 'cover_url', 'cover_credit', 'ranking_note', 'first_aired', 'frequency', 'format', 'best_for', 'seo_title', 'seo_description'] as const;

export function PodcastShowForm({ item }: { item?: PodcastShowRecord }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = !item;
  const [v, setV] = useState<Partial<PodcastShowRecord>>(item ?? { title: '', slug: '', description: '', rank: null, published: false, archived: false });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof PodcastShowRecord>(k: K, val: PodcastShowRecord[K] | null) => { setSaved(false); setV((p) => ({ ...p, [k]: val })); };
  const text = (k: keyof PodcastShowRecord) => (v[k] as string | null | undefined) ?? '';

  const save = useMutation({
    mutationFn: () => {
      const body: Partial<PodcastShowRecord> = { ...v };
      body.faq = (v.faq ?? []).filter((f) => f.q.trim() || f.a.trim());
      body.listen_links = (v.listen_links ?? []).filter((x) => x.label.trim() || x.url.trim());
      body.hosts = (v.hosts ?? []).filter((h) => h.name.trim()).map((h) => ({ ...h, person_slug: h.person_slug?.trim() || undefined }));
      body.related_article_slugs = (v.related_article_slugs ?? []).map((x) => x.trim()).filter(Boolean);
      body.videos = (v.videos ?? []).filter((x) => x.title.trim() || x.url.trim());
      body.episodes = (v.episodes ?? []).filter((x) => x.title.trim() || x.url.trim());
      body.sources = (v.sources ?? []).filter((x) => x.label.trim() || x.url.trim());
      if (String(v.overview ?? '').trim()) body.reviewed_at = new Date().toISOString();
      delete (body as { id?: number }).id; delete body.updated_at;
      for (const k of NULLABLE) if (body[k] === '') body[k] = null;
      return isNew ? podcastShowsApi.create(body) : podcastShowsApi.update(item!.id, body);
    },
    onSuccess: (row) => { setError(null); setSaved(true); qc.invalidateQueries({ queryKey: ['law', 'podcast-shows'] }); if (isNew) router.replace(`/law/podcasts/${row.id}`); },
    onError: (e) => { setSaved(false); setError(normalizeError(e as AxiosError).message); },
  });

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved. The site picks it up within about a minute.</div>}
      <Card>
        <CardHeader><CardTitle>Podcast</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="title">Title</Label><Input id="title" required maxLength={200} value={text('title')} onChange={(e) => { set('title', e.target.value); if (isNew) set('slug', slugify(e.target.value)); }} /></div>
          <div className="space-y-1.5"><Label htmlFor="slug">Web address</Label><Input id="slug" required disabled={!isNew} value={text('slug')} onChange={(e) => set('slug', slugify(e.target.value))} /></div>
          <div className="space-y-1.5"><Label htmlFor="host">Host(s)</Label><Input id="host" value={text('host')} onChange={(e) => set('host', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="publisher">Publisher or network (optional)</Label><Input id="publisher" value={text('publisher')} onChange={(e) => set('publisher', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="category">Category</Label><Input id="category" maxLength={60} placeholder="e.g. News, True crime, Business" value={text('category')} onChange={(e) => set('category', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="cc">Country</Label>
            <select id="cc" className={SELECT} value={v.country_code ?? ''} onChange={(e) => set('country_code', e.target.value || null)}><option value="">Not specific</option>{Object.entries(REGION_NAMES).filter(([c]) => c !== 'INTL').map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></div>
          <div className="space-y-1.5"><Label htmlFor="lang">Language</Label><Input id="lang" value={text('language')} onChange={(e) => set('language', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="listen">Listen link</Label><Input id="listen" type="url" placeholder="https://" value={text('listen_url')} onChange={(e) => set('listen_url', e.target.value)} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="desc">Description (your own words)</Label><Textarea id="desc" rows={3} value={text('description')} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="cover">Cover image address (optional)</Label><Input id="cover" type="url" placeholder="https://" value={text('cover_url')} onChange={(e) => set('cover_url', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="ccredit">Cover credit and licence</Label><Input id="ccredit" required={!!v.cover_url} value={text('cover_credit')} onChange={(e) => set('cover_credit', e.target.value)} /><p className="text-xs text-muted-foreground">Podcast artwork is copyrighted. Without a licensed cover the site shows a text tile.</p></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Its own page</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="overview">Write-up</Label><Textarea id="overview" rows={12} value={v.overview ?? ''} onChange={(e) => set('overview', e.target.value)} />
            <p className="text-xs text-muted-foreground">{(v.overview ?? '').trim().split(/\s+/).filter(Boolean).length} words. Separate paragraphs with a blank line. Write it yourself, from what you know or have listened to: what the show is, how it sounds, who it suits, what its weak spots are. Only state facts you can check; no invented numbers, guests or quotes. Pages under about 80 words should stay hidden from search.</p></div>
          <div className="space-y-1.5"><Label htmlFor="fa">Started (year)</Label><Input id="fa" value={text('first_aired')} onChange={(e) => set('first_aired', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="fr">New episodes</Label><Input id="fr" placeholder="e.g. Weekly" value={text('frequency')} onChange={(e) => set('frequency', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="fm">Format</Label><Input id="fm" value={text('format')} onChange={(e) => set('format', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="bf">Best for</Label><Input id="bf" value={text('best_for')} onChange={(e) => set('best_for', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="st">Search title (optional)</Label><Input id="st" maxLength={200} value={text('seo_title')} onChange={(e) => set('seo_title', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="sd">Search description (optional)</Label><Input id="sd" maxLength={320} value={text('seo_description')} onChange={(e) => set('seo_description', e.target.value)} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Where to listen (as many as you like)</Label>
            {(v.listen_links ?? []).map((l, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[1fr_2fr]">
                <Input aria-label="Platform" placeholder="e.g. Spotify, Official site" value={l.label} onChange={(e) => set('listen_links', (v.listen_links ?? []).map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <Input aria-label="Link" type="url" placeholder="https://" value={l.url} onChange={(e) => set('listen_links', (v.listen_links ?? []).map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Labels starting “Find on” are shown as plain search links; anything else is shown as a main button. Prefer the show's own page in each app.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => set('listen_links', [...(v.listen_links ?? []), { label: '', url: '' }])}>Add a listening link</Button></div>
          <div className="space-y-2 md:col-span-2"><Label>Start here (best episodes to begin with)</Label>
            {(v.episodes ?? []).map((ep, i) => (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <Input aria-label="Episode title" placeholder="Episode title" value={ep.title} onChange={(e) => set('episodes', (v.episodes ?? []).map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <Input aria-label="Episode link" type="url" placeholder="https:// link to the episode" value={ep.url} onChange={(e) => set('episodes', (v.episodes ?? []).map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                </div>
                <Input aria-label="Why listen" placeholder="Why this one, in a sentence, from what you heard" value={ep.note ?? ''} onChange={(e) => set('episodes', (v.episodes ?? []).map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set('episodes', [...(v.episodes ?? []), { title: '', url: '' }])}>Add an episode</Button></div>
          <div className="space-y-2 md:col-span-2"><Label>Videos (YouTube or Vimeo play on the page; other links open in a new tab)</Label>
            {(v.videos ?? []).map((vd, i) => (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <Input aria-label="Video title" placeholder="Video title" value={vd.title} onChange={(e) => set('videos', (v.videos ?? []).map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <Input aria-label="Video link" type="url" placeholder="https://www.youtube.com/watch?v=…" value={vd.url} onChange={(e) => set('videos', (v.videos ?? []).map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                </div>
                <Input aria-label="Caption" placeholder="One-line caption (optional)" value={vd.description ?? ''} onChange={(e) => set('videos', (v.videos ?? []).map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                <div className="grid gap-2 md:grid-cols-2">
                  <Input aria-label="Thumbnail address" type="url" placeholder="Thumbnail address (optional; YouTube uses its own)" value={vd.thumbnail_url ?? ''} onChange={(e) => set('videos', (v.videos ?? []).map((x, j) => (j === i ? { ...x, thumbnail_url: e.target.value } : x)))} />
                  <Input aria-label="Thumbnail credit" placeholder="Thumbnail credit (needed with a thumbnail)" value={vd.thumbnail_credit ?? ''} onChange={(e) => set('videos', (v.videos ?? []).map((x, j) => (j === i ? { ...x, thumbnail_credit: e.target.value } : x)))} />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set('videos', [...(v.videos ?? []), { title: '', url: '' }])}>Add a video</Button></div>
          <div className="space-y-2 md:col-span-2"><Label>About the hosts (background, in your own words)</Label>
            {(v.hosts ?? []).map((h, i) => (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <Input aria-label="Host name" placeholder="Name" value={h.name} onChange={(e) => set('hosts', (v.hosts ?? []).map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <Input aria-label="Profile page on this site (optional)" placeholder="Person page address, if we have one (e.g. joe-rogan)" value={h.person_slug ?? ''} onChange={(e) => set('hosts', (v.hosts ?? []).map((x, j) => (j === i ? { ...x, person_slug: e.target.value } : x)))} />
                </div>
                <Textarea aria-label="Background" rows={3} placeholder="Where they come from, what they did before the show. Only facts you can source." value={h.bio} onChange={(e) => set('hosts', (v.hosts ?? []).map((x, j) => (j === i ? { ...x, bio: e.target.value } : x)))} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set('hosts', [...(v.hosts ?? []), { name: '', bio: '' }])}>Add a host</Button></div>
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="arts">Related articles on this site (one address per line)</Label>
            <Textarea id="arts" rows={3} placeholder="article-slug-one" value={(v.related_article_slugs ?? []).join('\n')} onChange={(e) => set('related_article_slugs', e.target.value.split('\n'))} />
            <p className="text-xs text-muted-foreground">Articles you have written about the show or its host. They appear on the podcast's page as links, and give search engines a route between the pages.</p></div>
          <div className="space-y-2 md:col-span-2"><Label>Quick answers (shown on the page)</Label>
            {(v.faq ?? []).map((f, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-2">
                <Input aria-label="Question" placeholder="Question" value={f.q} onChange={(e) => set('faq', (v.faq ?? []).map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                <Input aria-label="Answer" placeholder="Answer" value={f.a} onChange={(e) => set('faq', (v.faq ?? []).map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set('faq', [...(v.faq ?? []), { q: '', a: '' }])}>Add a question</Button></div>
          <div className="space-y-2 md:col-span-2"><Label>Sources (shown on the page)</Label>
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
        <CardHeader><CardTitle>Top 10 ranking</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="rank">Position in its country's Top 10 (1 to 10)</Label><Input id="rank" type="number" min={1} max={100} value={v.rank ?? ''} onChange={(e) => set('rank', e.target.value === '' ? null : Number(e.target.value))} /><p className="text-xs text-muted-foreground">Ranked within the country chosen above (USA, UK, India each have their own list). Leave empty to list it under “More podcasts”.</p></div>
          <div className="space-y-1.5"><Label htmlFor="note">Where the ranking comes from</Label><Input id="note" value={text('ranking_note')} onChange={(e) => set('ranking_note', e.target.value)} /><p className="text-xs text-muted-foreground">Shown under the heading. Name the chart and date if you rank by one.</p></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {([['published', 'Published', 'Shown on /podcasts.'], ['indexable', 'Let search engines index its page', 'Turn on only when the write-up is finished and checked.'], ['archived', 'Archived', 'Takes it offline without deleting it.']] as const).map(([k, l, d]) => (
            <div key={k} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={!!v[k]} onCheckedChange={(c) => set(k, c)} aria-label={l} /></div>
          ))}
        </CardContent>
      </Card>
      {!isNew && item && <PodcastPhotos slug={item.slug} suggestions={[...(item.hosts ?? []).map((h) => h.name), item.title]} />}
      <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : isNew ? 'Create podcast' : 'Save changes'}</Button>
    </form>
  );
}
