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
import { TOPIC_PILLARS, topicsApi, slugify, type TopicRecord } from '@/lib/law/legal';

const SELECT = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

const EMPTY: Partial<TopicRecord> = { slug: '', name: '', pillar: 'general', aliases: [], description: '', published: false, indexable: false, archived: false };

export function TopicForm({ topic }: { topic?: TopicRecord }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = !topic;
  const [v, setV] = useState<Partial<TopicRecord>>(topic ?? EMPTY);
  const [aliases, setAliases] = useState((topic?.aliases ?? []).join(', '));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof TopicRecord>(k: K, val: TopicRecord[K] | null) => { setSaved(false); setV((p) => ({ ...p, [k]: val })); };
  const text = (k: keyof TopicRecord) => (v[k] as string | null | undefined) ?? '';

  const save = useMutation({
    mutationFn: () => {
      const body: Partial<TopicRecord> = { ...v, aliases: aliases.split(',').map((a) => a.trim()).filter(Boolean) };
      delete (body as Partial<TopicRecord> & { id?: number }).id;
      delete body.updated_at;
      return isNew ? topicsApi.create(body) : topicsApi.update(topic!.id, body);
    },
    onSuccess: (row) => { setError(null); setSaved(true); qc.invalidateQueries({ queryKey: ['law', 'topics'] }); if (isNew) router.replace(`/law/topics/${row.id}`); },
    onError: (e) => { setSaved(false); setError(normalizeError(e as AxiosError).message); },
  });

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved. The website refreshes within moments if live updates are configured.</div>}

      <Card>
        <CardHeader><CardTitle>Topic</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="name">Name</Label><Input id="name" required value={text('name')} onChange={(e) => { set('name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} /><p className="text-xs text-muted-foreground">At least 4 characters: shorter names are never matched in article text.</p></div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">URL slug</Label>
            <Input id="slug" required disabled={!isNew} value={text('slug')} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
            <p className="text-xs text-muted-foreground">{isNew ? 'Becomes /topics/{slug}. Cannot be changed later.' : 'Fixed: the URL is live.'}</p>
          </div>
          <div className="space-y-1.5"><Label htmlFor="pillar">Pillar</Label><select id="pillar" className={SELECT} value={text('pillar')} onChange={(e) => set('pillar', e.target.value)}>{TOPIC_PILLARS.map((p) => <option key={p}>{p}</option>)}</select></div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="aliases">Other names (comma separated)</Label>
            <Input id="aliases" value={aliases} onChange={(e) => { setSaved(false); setAliases(e.target.value); }} />
            <p className="text-xs text-muted-foreground">Phrases that also tag an article with this topic. Each at least 4 characters.</p>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={7} value={text('description')} onChange={(e) => set('description', e.target.value)} />
            <p className="text-xs text-muted-foreground">Write in your own words. Blank paragraphs separate text. A topic with no description and no tagged articles stays out of Google.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {([
            ['published', 'Published', 'Visible on the website.'],
            ['indexable', 'Allow search engines', 'Adds the page to the sitemap when it has content.'],
            ['archived', 'Archived', 'Takes the topic offline without deleting it (also hides the website’s built-in copy).'],
          ] as const).map(([k, l, d]) => (
            <div key={k} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={!!v[k]} onCheckedChange={(c) => set(k, c)} aria-label={l} /></div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : isNew ? 'Create topic' : 'Save changes'}</Button>
    </form>
  );
}
