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
import { COMMON_SPORTS, sportsTeamsApi, slugify, type SportsTeamRecord } from '@/lib/law/legal';

const SELECT = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';
const EMPTY: Partial<SportsTeamRecord> = { slug: '', name: '', sport: 'Basketball', description: '', published: false, indexable: false, verified: false, archived: false };

export function TeamForm({ team }: { team?: SportsTeamRecord }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = !team;
  const [v, setV] = useState<Partial<SportsTeamRecord>>(team ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof SportsTeamRecord>(k: K, val: SportsTeamRecord[K] | null) => { setSaved(false); setV((p) => ({ ...p, [k]: val })); };
  const text = (k: keyof SportsTeamRecord) => (v[k] as string | null | undefined) ?? '';

  const save = useMutation({
    mutationFn: () => {
      const body: Partial<SportsTeamRecord> = { ...v, country_code: v.country_code ? String(v.country_code).toUpperCase() : null };
      delete (body as Partial<SportsTeamRecord> & { id?: number }).id;
      delete body.updated_at;
      return isNew ? sportsTeamsApi.create(body) : sportsTeamsApi.update(team!.id, body);
    },
    onSuccess: (row) => { setError(null); setSaved(true); qc.invalidateQueries({ queryKey: ['law', 'sports-teams'] }); if (isNew) router.replace(`/law/sports-teams/${row.id}`); },
    onError: (e) => { setSaved(false); setError(normalizeError(e as AxiosError).message); },
  });

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved. The website refreshes within moments if live updates are configured.</div>}
      <Card>
        <CardHeader><CardTitle>Team</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" required value={text('name')} onChange={(e) => { set('name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">URL slug</Label>
            <Input id="slug" required disabled={!isNew} value={text('slug')} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
            <p className="text-xs text-muted-foreground">{isNew ? 'Becomes /sports/teams/{slug}. Cannot be changed later.' : 'Fixed: the URL is live.'}</p>
          </div>
          <div className="space-y-1.5"><Label htmlFor="sport">Sport</Label><Input id="sport" list="sports-list" required value={text('sport')} onChange={(e) => set('sport', e.target.value)} /><datalist id="sports-list">{COMMON_SPORTS.map((x) => <option key={x} value={x} />)}</datalist></div>
          <div className="space-y-1.5"><Label htmlFor="country_code">Country (2-letter code)</Label><Input id="country_code" maxLength={2} value={text('country_code')} onChange={(e) => set('country_code', e.target.value.toUpperCase() || null)} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="url">Official website (https)</Label><Input id="url" value={text('url')} onChange={(e) => set('url', e.target.value || null)} /></div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={6} value={text('description')} onChange={(e) => set('description', e.target.value)} />
            <p className="text-xs text-muted-foreground">Write in your own words. Facts can be reused; sentences from other sites cannot.</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {([
            ['published', 'Published', 'Visible on the website.'],
            ['indexable', 'Allow search engines', 'Adds the page to the sitemap. Turn on once the description is original and complete.'],
            ['verified', 'Reviewed by an editor', 'Shows the verified badge.'],
            ['archived', 'Archived', 'Takes the team offline without deleting it (also hides the website’s built-in copy).'],
          ] as const).map(([k, l, d]) => (
            <div key={k} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={!!v[k]} onCheckedChange={(c) => set(k, c)} aria-label={l} /></div>
          ))}
        </CardContent>
      </Card>
      <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : isNew ? 'Create team' : 'Save changes'}</Button>
    </form>
  );
}
