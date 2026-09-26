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
import { PersonPhotos } from './PersonPhotos';
import { PersonTags } from './PersonTags';
import { PERSON_CATEGORIES, PERSON_STATUSES, peopleApi, slugify, type PersonRecord } from '@/lib/law/people';

const SELECT = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';
type Row = Record<string, unknown>;

const blank = (rows: Row[] | undefined) => (rows ?? []).filter((r) => Object.values(r).some((v) => v !== undefined && v !== ''));

const EMPTY: Partial<PersonRecord> = {
  full_name: '', slug: '', category: 'actors', status: 'active', career: [], education: [], awards: [], timeline: [], sources: [], social: {},
  published: false, indexable: false, verified: false, archived: false,
};

export function PersonForm({ person }: { person?: PersonRecord }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = !person;
  const [v, setV] = useState<Partial<PersonRecord>>(person ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof PersonRecord>(k: K, val: PersonRecord[K] | null) => { setSaved(false); setV((p) => ({ ...p, [k]: val })); };
  const text = (k: keyof PersonRecord) => (v[k] as string | null | undefined) ?? '';

  const save = useMutation({
    mutationFn: () => {
      const body: Partial<PersonRecord> = {
        ...v,
        career: blank(v.career) as Row[], education: blank(v.education) as Row[], awards: blank(v.awards) as Row[],
        timeline: blank(v.timeline) as Row[], sources: blank(v.sources) as Row[],
        country_code: v.country_code ? String(v.country_code).toUpperCase() : null,
      };
      // Server-managed columns are not part of the edit payload.
      delete (body as Partial<PersonRecord> & { id?: number }).id;
      delete body.updated_at;
      return isNew ? peopleApi.create(body) : peopleApi.update(person!.id, body);
    },
    onSuccess: (row) => {
      setError(null); setSaved(true);
      qc.invalidateQueries({ queryKey: ['law', 'people'] });
      if (isNew) router.replace(`/law/people/${row.id}`);
    },
    onError: (e) => { setSaved(false); setError(normalizeError(e as AxiosError).message); },
  });

  return (
    <div className="space-y-6">
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved. The website refreshes within moments if live updates are configured.</div>}

      <Card>
        <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" value={text('full_name')} required onChange={(e) => { set('full_name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">URL slug</Label>
            <Input id="slug" value={text('slug')} required disabled={!isNew} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
            <p className="text-xs text-muted-foreground">{isNew ? 'Becomes /people/{slug}. Cannot be changed later.' : 'Fixed: changing a live URL would break links and rankings.'}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Display name (if different)</Label>
            <Input id="display_name" value={text('display_name')} onChange={(e) => set('display_name', e.target.value || null)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <select id="category" className={SELECT} value={text('category')} onChange={(e) => set('category', e.target.value)}>
              {PERSON_CATEGORIES.map(([s, l]) => <option key={s} value={s}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select id="status" className={SELECT} value={text('status')} onChange={(e) => set('status', e.target.value)}>
              {PERSON_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country_code">Country (2-letter code)</Label>
            <Input id="country_code" maxLength={2} value={text('country_code')} onChange={(e) => set('country_code', e.target.value.toUpperCase() || null)} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="birth_date">Born (YYYY or YYYY-MM-DD)</Label><Input id="birth_date" value={text('birth_date')} onChange={(e) => set('birth_date', e.target.value || null)} /></div>
          <div className="space-y-1.5"><Label htmlFor="birth_place">Birthplace</Label><Input id="birth_place" value={text('birth_place')} onChange={(e) => set('birth_place', e.target.value || null)} /></div>
          <div className="space-y-1.5"><Label htmlFor="death_date">Died</Label><Input id="death_date" value={text('death_date')} onChange={(e) => set('death_date', e.target.value || null)} /></div>
          <div className="space-y-1.5"><Label htmlFor="official_website">Official website (https)</Label><Input id="official_website" value={text('official_website')} onChange={(e) => set('official_website', e.target.value || null)} /></div>
          <div className="space-y-1.5"><Label htmlFor="wikidata_id">Wikidata ID</Label><Input id="wikidata_id" placeholder="Q11116" value={text('wikidata_id')} onChange={(e) => set('wikidata_id', e.target.value || null)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Writing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="short_bio">One-line summary</Label>
            <Textarea id="short_bio" rows={2} value={text('short_bio')} onChange={(e) => set('short_bio', e.target.value || null)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biography">Biography</Label>
            <Textarea id="biography" rows={14} value={text('biography')} onChange={(e) => set('biography', e.target.value || null)} />
            <p className="text-xs text-muted-foreground">Write in your own words: facts can be reused, sentences from Wikipedia or other sites cannot. Leave a blank line between paragraphs.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <ListEditor label="Career" hint="Positions and roles, newest last." columns={[{ key: 'title', label: 'Title' }, { key: 'organization', label: 'Organization' }, { key: 'startYear', label: 'From', type: 'number', width: 'w-24' }, { key: 'endYear', label: 'To', type: 'number', width: 'w-24' }]} rows={(v.career ?? []) as Row[]} onChange={(r) => set('career', r)} />
          <ListEditor label="Education" columns={[{ key: 'institution', label: 'Institution' }, { key: 'degree', label: 'Degree' }, { key: 'year', label: 'Year', type: 'number', width: 'w-24' }]} rows={(v.education ?? []) as Row[]} onChange={(r) => set('education', r)} />
          <ListEditor label="Awards & honors" columns={[{ key: 'title', label: 'Award' }, { key: 'year', label: 'Year', type: 'number', width: 'w-24' }]} rows={(v.awards ?? []) as Row[]} onChange={(r) => set('awards', r)} />
          <ListEditor label="Timeline" hint="Key dates: YYYY or YYYY-MM-DD." columns={[{ key: 'date', label: 'Date', width: 'w-36' }, { key: 'title', label: 'What happened' }]} rows={(v.timeline ?? []) as Row[]} onChange={(r) => set('timeline', r)} />
          <ListEditor label="Sources" hint="Where the facts came from; shown on the page." columns={[{ key: 'label', label: 'Label', width: 'w-56' }, { key: 'url', label: 'https://…', type: 'url' }]} rows={(v.sources ?? []) as Row[]} onChange={(r) => set('sources', r)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sports (athletes only)</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {([['sport', 'Sport', 'Basketball'], ['position', 'Position or event', 'Forward'], ['teamSlug', 'Team page slug', 'los-angeles-lakers']] as const).map(([k, label, ph]) => (
            <div key={k} className="space-y-1.5">
              <Label htmlFor={`sports-${k}`}>{label}</Label>
              <Input id={`sports-${k}`} placeholder={ph} value={String((v.sports_info as Record<string, unknown> | undefined)?.[k] ?? '')} onChange={(e) => { setSaved(false); const next = { ...(v.sports_info ?? {}), [k]: e.target.value }; Object.keys(next).forEach((x) => next[x] === '' && delete next[x]); setV((p) => ({ ...p, sports_info: next })); }} />
            </div>
          ))}
          <p className="text-xs text-muted-foreground md:col-span-3">Filling in a team slug lists this person on that team’s page. Leave everything empty for non-athletes; a sport is required if you fill anything in.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Search appearance</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-1.5"><Label htmlFor="seo_title">Page title (optional)</Label><Input id="seo_title" maxLength={200} value={text('seo_title')} onChange={(e) => set('seo_title', e.target.value || null)} /></div>
          <div className="space-y-1.5"><Label htmlFor="seo_description">Meta description (optional, under 160 characters)</Label><Textarea id="seo_description" rows={2} maxLength={400} value={text('seo_description')} onChange={(e) => set('seo_description', e.target.value || null)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {([
            ['published', 'Published', 'Visible on the website. Unpublished profiles are hidden everywhere.'],
            ['indexable', 'Allow search engines', 'Adds the page to the sitemap. Only turn on when the profile has original writing, a photo and sources.'],
            ['featured', 'Feature on homepage', 'Pins this person to the homepage “Featured people” row, ahead of automatic picks.'],
            ['verified', 'Reviewed by an editor', 'Shows the verified badge.'],
            ['archived', 'Archived', 'Takes the profile offline without deleting it.'],
          ] as const).map(([k, l, d]) => (
            <div key={k} className="flex items-center justify-between gap-4">
              <div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div>
              <Switch checked={!!v[k]} onCheckedChange={(c) => set(k, c)} aria-label={l} />
            </div>
          ))}
          <div className="space-y-1.5"><Label htmlFor="source_note">Review note</Label><Input id="source_note" value={text('source_note')} onChange={(e) => set('source_note', e.target.value || null)} /></div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : isNew ? 'Create profile' : 'Save changes'}</Button>
        {!isNew && <a className="text-sm text-muted-foreground underline" href={`${process.env.NEXT_PUBLIC_LAW_SITE_URL || 'https://lawelitenetwork.com'}/people/${person!.slug}`} target="_blank" rel="noopener noreferrer">View on site</a>}
      </div>
    </form>

      {!isNew && (
        <>
          <Card><CardHeader><CardTitle>Photos</CardTitle></CardHeader><CardContent><PersonPhotos personId={person!.id} personName={person!.display_name || person!.full_name} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Tags</CardTitle></CardHeader><CardContent><PersonTags personId={person!.id} /></CardContent></Card>
        </>
      )}
      {isNew && <p className="text-sm text-muted-foreground">Photos and tags can be added right after the profile is created.</p>}
    </div>
  );
}
