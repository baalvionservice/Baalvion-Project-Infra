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
import { COMMON_SPORTS, COMPETITION_LEVELS, sportsCompetitionsApi, slugify, type SportsCompetitionRecord } from '@/lib/law/legal';

const SELECT = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';
type Row = Record<string, unknown>;

const blank = (rows: Row[] | undefined) => (rows ?? []).filter((r) => Object.values(r).some((v) => v !== undefined && v !== ''));
const MEDIA_COLUMNS = [{ key: 'title', label: 'Title' }, { key: 'source', label: 'Publisher', width: 'w-40' }, { key: 'publishedAt', label: 'Date', width: 'w-28' }, { key: 'url', label: 'https://…', type: 'url' as const }];

const EMPTY: Partial<SportsCompetitionRecord> = {
  slug: '', name: '', sport: 'Basketball', level: 'championship', description: '', people_involved: [], related_article_slugs: [], videos: [],
  published: false, indexable: false, verified: false, archived: false,
};

export function CompetitionForm({ competition }: { competition?: SportsCompetitionRecord }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = !competition;
  const [v, setV] = useState<Partial<SportsCompetitionRecord>>(competition ?? EMPTY);
  const [related, setRelated] = useState((competition?.related_article_slugs ?? []).join(', '));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof SportsCompetitionRecord>(k: K, val: SportsCompetitionRecord[K] | null) => { setSaved(false); setV((p) => ({ ...p, [k]: val })); };
  const text = (k: keyof SportsCompetitionRecord) => (v[k] as string | null | undefined) ?? '';

  const save = useMutation({
    mutationFn: () => {
      const body: Partial<SportsCompetitionRecord> = {
        ...v,
        people_involved: blank(v.people_involved), videos: blank(v.videos),
        related_article_slugs: related.split(',').map((s) => slugify(s)).filter(Boolean),
      };
      delete (body as Partial<SportsCompetitionRecord> & { id?: number }).id;
      delete body.updated_at;
      return isNew ? sportsCompetitionsApi.create(body) : sportsCompetitionsApi.update(competition!.id, body);
    },
    onSuccess: (row) => { setError(null); setSaved(true); qc.invalidateQueries({ queryKey: ['law', 'sports-competitions'] }); if (isNew) router.replace(`/law/sports-competitions/${row.id}`); },
    onError: (e) => { setSaved(false); setError(normalizeError(e as AxiosError).message); },
  });

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved. The website refreshes within moments if live updates are configured.</div>}

      <Card>
        <CardHeader><CardTitle>Competition</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="name">Name</Label><Input id="name" required value={text('name')} onChange={(e) => { set('name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">URL slug</Label>
            <Input id="slug" required disabled={!isNew} value={text('slug')} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
            <p className="text-xs text-muted-foreground">{isNew ? 'Becomes /sports/competitions/{slug}. Cannot be changed later.' : 'Fixed: the URL is live.'}</p>
          </div>
          <div className="space-y-1.5"><Label htmlFor="sport">Sport</Label><Input id="sport" list="sports-list" required value={text('sport')} onChange={(e) => set('sport', e.target.value)} /><datalist id="sports-list">{COMMON_SPORTS.map((x) => <option key={x} value={x} />)}</datalist></div>
          <div className="space-y-1.5"><Label htmlFor="level">Level</Label><select id="level" className={SELECT} value={text('level')} onChange={(e) => set('level', e.target.value)}>{COMPETITION_LEVELS.map((l) => <option key={l}>{l}</option>)}</select></div>
          <div className="space-y-1.5"><Label htmlFor="event_date">Date (YYYY, YYYY-MM or YYYY-MM-DD)</Label><Input id="event_date" value={text('event_date')} onChange={(e) => set('event_date', e.target.value || null)} /></div>
          <div className="space-y-1.5"><Label htmlFor="country_code">Country (2-letter code)</Label><Input id="country_code" maxLength={2} value={text('country_code')} onChange={(e) => set('country_code', e.target.value.toUpperCase() || null)} /></div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={7} value={text('description')} onChange={(e) => set('description', e.target.value)} />
            <p className="text-xs text-muted-foreground">Write in your own words. Facts can be reused; sentences from Wikipedia, IMDb or a studio cannot. No scores, standings or betting information.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Athletes</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <ListEditor label="Athletes" hint="Use the person’s profile slug (the part after /people/). Role is free text: Player, Gold medalist…; result is optional." columns={[{ key: 'personSlug', label: 'Profile slug', width: 'w-56' }, { key: 'role', label: 'Role' }, { key: 'result', label: 'Result (optional)' }]} rows={(v.people_involved ?? []) as Row[]} onChange={(r) => set('people_involved', r)} />
          <div className="space-y-1.5">
            <Label htmlFor="related">Related articles (slugs, comma separated)</Label>
            <Input id="related" value={related} onChange={(e) => { setSaved(false); setRelated(e.target.value); }} />
            <p className="text-xs text-muted-foreground">Optional. Articles that name this entry are connected automatically.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Videos</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <ListEditor label="Videos" hint="Links to the publisher’s own page (YouTube and Vimeo play on the site). https only." columns={MEDIA_COLUMNS} rows={(v.videos ?? []) as Row[]} onChange={(r) => set('videos', r)} />
          <p className="text-xs text-muted-foreground">Match footage is copyrighted: link to the publisher’s own page rather than uploading.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="source_note">Where the facts come from</Label><Input id="source_note" value={text('source_note')} onChange={(e) => set('source_note', e.target.value || null)} /></div>
          {([
            ['published', 'Published', 'Visible on the website.'],
            ['indexable', 'Allow search engines', 'Adds the page to the sitemap. Turn on once the description is original.'],
            ['verified', 'Reviewed by an editor', 'Shows the verified badge.'],
            ['archived', 'Archived', 'Takes the competition offline without deleting it (also hides the website’s built-in copy).'],
          ] as const).map(([k, l, d]) => (
            <div key={k} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={!!v[k]} onCheckedChange={(c) => set(k, c)} aria-label={l} /></div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : isNew ? 'Create competition' : 'Save changes'}</Button>
    </form>
  );
}
