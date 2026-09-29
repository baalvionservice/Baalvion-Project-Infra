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
import { ListEditor } from './ListEditor';
import { ENTERTAINMENT_TYPES, entertainmentApi, slugify, type EntertainmentRecord } from '@/lib/law/legal';

const SELECT = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';
type Row = Record<string, unknown>;

const blank = (rows: Row[] | undefined) => (rows ?? []).filter((r) => Object.values(r).some((v) => v !== undefined && v !== ''));
const MEDIA_COLUMNS = [{ key: 'title', label: 'Title' }, { key: 'source', label: 'Publisher', width: 'w-40' }, { key: 'publishedAt', label: 'Date', width: 'w-28' }, { key: 'url', label: 'https://…', type: 'url' as const }];

const EMPTY: Partial<EntertainmentRecord> = {
  slug: '', title: '', type: 'movie', description: '', people_involved: [], related_entities: [], related_article_slugs: [], videos: [], interviews: [],
  published: false, indexable: false, verified: false, archived: false,
};

export function EntertainmentForm({ entry }: { entry?: EntertainmentRecord }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = !entry;
  const [v, setV] = useState<Partial<EntertainmentRecord>>(entry ?? EMPTY);
  const [related, setRelated] = useState((entry?.related_article_slugs ?? []).join(', '));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof EntertainmentRecord>(k: K, val: EntertainmentRecord[K] | null) => { setSaved(false); setV((p) => ({ ...p, [k]: val })); };
  const text = (k: keyof EntertainmentRecord) => (v[k] as string | null | undefined) ?? '';

  const save = useMutation({
    mutationFn: () => {
      const body: Partial<EntertainmentRecord> = {
        ...v,
        people_involved: blank(v.people_involved), related_entities: blank(v.related_entities), videos: blank(v.videos), interviews: blank(v.interviews),
        related_article_slugs: related.split(',').map((s) => slugify(s)).filter(Boolean),
      };
      delete (body as Partial<EntertainmentRecord> & { id?: number }).id;
      delete body.updated_at;
      return isNew ? entertainmentApi.create(body) : entertainmentApi.update(entry!.id, body);
    },
    onSuccess: (row) => { setError(null); setSaved(true); qc.invalidateQueries({ queryKey: ['law', 'entertainment'] }); if (isNew) router.replace(`/law/entertainment/${row.id}`); },
    onError: (e) => { setSaved(false); setError(normalizeError(e as AxiosError).message); },
  });

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved. The website refreshes within moments if live updates are configured.</div>}

      <Card>
        <CardHeader><CardTitle>Entry</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="title">Title</Label><Input id="title" required value={text('title')} onChange={(e) => { set('title', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">URL slug</Label>
            <Input id="slug" required disabled={!isNew} value={text('slug')} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
            <p className="text-xs text-muted-foreground">{isNew ? 'Becomes /entertainment/{slug}. Cannot be changed later.' : 'Fixed: the URL is live.'}</p>
          </div>
          <div className="space-y-1.5"><Label htmlFor="type">Type</Label><select id="type" className={SELECT} value={text('type')} onChange={(e) => set('type', e.target.value)}>{ENTERTAINMENT_TYPES.map(([s, l]) => <option key={s} value={s}>{l}</option>)}</select></div>
          <div className="space-y-1.5"><Label htmlFor="release_date">Release date (YYYY or YYYY-MM-DD)</Label><Input id="release_date" value={text('release_date')} onChange={(e) => set('release_date', e.target.value || null)} /></div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={7} value={text('description')} onChange={(e) => set('description', e.target.value)} />
            <p className="text-xs text-muted-foreground">Write in your own words. Facts can be reused; sentences from Wikipedia, IMDb or a studio cannot. No box-office or business figures.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>People and connections</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <ListEditor label="Credits" hint="Use the person’s profile slug (the part after /people/). The role is free text: Actor, Director, Artist, Recipient…" columns={[{ key: 'personSlug', label: 'Profile slug', width: 'w-56' }, { key: 'role', label: 'Role' }, { key: 'character', label: 'Character (optional)' }]} rows={(v.people_involved ?? []) as Row[]} onChange={(r) => set('people_involved', r)} />
          <ListEditor label="Related entries" hint="Sequels, same franchise, the ceremony an award belongs to…" columns={[{ key: 'slug', label: 'Entry slug', width: 'w-56' }, { key: 'relationship', label: 'How they relate' }]} rows={(v.related_entities ?? []) as Row[]} onChange={(r) => set('related_entities', r)} />
          <div className="space-y-1.5">
            <Label htmlFor="related">Related articles (slugs, comma separated)</Label>
            <Input id="related" value={related} onChange={(e) => { setSaved(false); setRelated(e.target.value); }} />
            <p className="text-xs text-muted-foreground">Optional. Articles that name this entry are connected automatically.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Videos and interviews</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <ListEditor label="Videos" hint="Links to the publisher’s own page (YouTube and Vimeo play on the site). https only. These also appear on the site’s Videos page." columns={MEDIA_COLUMNS} rows={(v.videos ?? []) as Row[]} onChange={(r) => set('videos', r)} />
          <ListEditor label="Interviews" hint="Same rules. These appear on the site’s Interviews page." columns={MEDIA_COLUMNS} rows={(v.interviews ?? []) as Row[]} onChange={(r) => set('interviews', r)} />
          <p className="text-xs text-muted-foreground">Posters and cover art are copyrighted, so they are not managed here. The page shows a generated tile until LEN holds a properly licensed image.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Search appearance and publishing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="seo_title">Page title (optional)</Label><Input id="seo_title" maxLength={200} value={text('seo_title')} onChange={(e) => set('seo_title', e.target.value || null)} /></div>
          <div className="space-y-1.5"><Label htmlFor="seo_description">Meta description (optional, under 160 characters)</Label><Textarea id="seo_description" rows={2} maxLength={400} value={text('seo_description')} onChange={(e) => set('seo_description', e.target.value || null)} /></div>
          <div className="space-y-1.5"><Label htmlFor="source_note">Where the facts come from</Label><Input id="source_note" value={text('source_note')} onChange={(e) => set('source_note', e.target.value || null)} /></div>
          {([
            ['published', 'Published', 'Visible on the website.'],
            ['indexable', 'Allow search engines', 'Adds the page to the sitemap. Turn on once the description is original.'],
            ['verified', 'Reviewed by an editor', 'Shows the verified badge.'],
            ['archived', 'Archived', 'Takes the entry offline without deleting it (also hides the website’s built-in copy).'],
          ] as const).map(([k, l, d]) => (
            <div key={k} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={!!v[k]} onCheckedChange={(c) => set(k, c)} aria-label={l} /></div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : isNew ? 'Create entry' : 'Save changes'}</Button>
    </form>
  );
}
