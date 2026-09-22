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
import { HOME_WIDGETS, REGION_NAMES, homeWidgetsApi, type HomeWidgetKind, type HomeWidgetRecord } from '@/lib/law/legal';

const SELECT = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

/** Which optional fields each widget uses; the rest are hidden so an editor is never asked for something that will not show. */
const USES: Record<HomeWidgetKind, { summary?: boolean; source?: boolean; url?: string; image?: boolean; credit?: boolean; value?: boolean; when?: boolean; docket?: boolean }> = {
  breaking: { summary: true, source: true, url: 'Link to the source (optional)', when: true },
  ticker: { value: true, url: 'Link (optional)' },
  audio: { summary: true, source: true, url: 'Audio file address (https, mp3/m4a)' },
  docket: { summary: true, source: true, url: 'Official docket or court page', docket: true },
  gallery: { image: true, credit: true, url: 'Where the photo came from (optional)' },
  shorts: { summary: true, source: true, url: 'Video address (https)', image: true },
};

const toLocal = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

export function HomeWidgetForm({ item }: { item?: HomeWidgetRecord }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = !item;
  const [v, setV] = useState<Partial<HomeWidgetRecord>>(item ?? { widget: 'breaking', title: '', summary: '', extra: {}, sort_order: 0, published: false, archived: false });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const kind = (v.widget ?? 'breaking') as HomeWidgetKind;
  const uses = USES[kind];
  const isGallery: boolean = kind === 'gallery';
  const meta = HOME_WIDGETS.find((w) => w.kind === kind);
  const set = <K extends keyof HomeWidgetRecord>(k: K, val: HomeWidgetRecord[K] | null) => { setSaved(false); setV((p) => ({ ...p, [k]: val })); };
  const text = (k: keyof HomeWidgetRecord) => (v[k] as string | null | undefined) ?? '';
  const extra = (k: string) => v.extra?.[k] ?? '';
  const setExtra = (k: string, val: string) => set('extra', { ...(v.extra ?? {}), [k]: val });

  const save = useMutation({
    mutationFn: () => {
      const body: Partial<HomeWidgetRecord> = { ...v };
      delete (body as { id?: number }).id;
      delete body.updated_at;
      if (!isNew) delete body.widget;
      for (const k of ['summary', 'source_name', 'url', 'image_url', 'credit', 'value', 'region'] as const) if (body[k] === '') body[k] = null;
      return isNew ? homeWidgetsApi.create(body) : homeWidgetsApi.update(item!.id, body);
    },
    onSuccess: (row) => { setError(null); setSaved(true); qc.invalidateQueries({ queryKey: ['law', 'home-widgets'] }); if (isNew) router.replace(`/law/home-widgets/${row.id}`); },
    onError: (e) => { setSaved(false); setError(normalizeError(e as AxiosError).message); },
  });

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved. The homepage picks it up within about a minute.</div>}

      <Card>
        <CardHeader><CardTitle>Entry</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="widget">Widget</Label>
            <select id="widget" className={SELECT} disabled={!isNew} value={kind} onChange={(e) => set('widget', e.target.value as HomeWidgetKind)}>
              {HOME_WIDGETS.map((w) => <option key={w.kind} value={w.kind}>{w.label}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">{isNew ? meta?.hint : 'Fixed once created.'}</p>
          </div>
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="title">{kind === 'ticker' ? 'Label' : 'Title'}</Label><Input id="title" required maxLength={300} value={text('title')} onChange={(e) => set('title', e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="region">Country (optional)</Label>
            <select id="region" className={SELECT} value={v.region ?? ''} onChange={(e) => set('region', e.target.value || null)}>
              <option value="">Not specific to one country</option>
              {Object.entries(REGION_NAMES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Used to group and filter entries by country in the admin.</p>
          </div>
          {uses.value && <div className="space-y-1.5"><Label htmlFor="value">Value</Label><Input id="value" required value={text('value')} onChange={(e) => set('value', e.target.value)} /><p className="text-xs text-muted-foreground">Shown exactly as typed. Only enter figures you can source.</p></div>}
          {uses.summary && <div className="space-y-1.5 md:col-span-2"><Label htmlFor="summary">Summary</Label><Textarea id="summary" rows={3} maxLength={2000} value={text('summary')} onChange={(e) => set('summary', e.target.value)} /></div>}
          {uses.source && <div className="space-y-1.5"><Label htmlFor="source">Source name</Label><Input id="source" required={kind === 'breaking'} value={text('source_name')} onChange={(e) => set('source_name', e.target.value)} /></div>}
          {isGallery && uses.image && <div className="space-y-1.5"><Label htmlFor="image">{kind === 'shorts' ? 'Thumbnail address (optional)' : 'Image address'}</Label><Input id="image" type="url" required={kind === 'gallery'} placeholder="https://" value={text('image_url')} onChange={(e) => set('image_url', e.target.value)} /></div>}
          {uses.url && <div className="space-y-1.5"><Label htmlFor="url">{uses.url}</Label><Input id="url" type="url" required={kind === 'audio' || kind === 'docket' || kind === 'shorts'} placeholder="https://" value={text('url')} onChange={(e) => set('url', e.target.value)} /></div>}
          {!isGallery && uses.image && <div className="space-y-1.5"><Label htmlFor="image">{kind === 'shorts' ? 'Thumbnail address (optional)' : 'Image address'}</Label><Input id="image" type="url" required={kind === 'gallery'} placeholder="https://" value={text('image_url')} onChange={(e) => set('image_url', e.target.value)} /></div>}
          {uses.credit && <div className="space-y-1.5 md:col-span-2"><Label htmlFor="credit">Credit and licence</Label><Input id="credit" required value={text('credit')} onChange={(e) => set('credit', e.target.value)} /><p className="text-xs text-muted-foreground">e.g. “Jane Doe, CC BY 4.0”. Shown under the photo. Without it the photo cannot be saved.</p></div>}
          {uses.docket && (
            <>
              <div className="space-y-1.5"><Label htmlFor="court">Court</Label><Input id="court" required value={extra('court')} onChange={(e) => setExtra('court', e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="dstatus">Status</Label><Input id="dstatus" required placeholder="e.g. Trial, Appeal pending" value={extra('status')} onChange={(e) => setExtra('status', e.target.value)} /></div>
              <div className="space-y-1.5 md:col-span-2"><Label htmlFor="next">Next hearing (optional)</Label><Input id="next" placeholder="e.g. 14 Oct 2026" value={extra('next_hearing')} onChange={(e) => setExtra('next_hearing', e.target.value)} /></div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Timing and order</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {uses.when && <div className="space-y-1.5"><Label htmlFor="event">Happened at</Label><Input id="event" type="datetime-local" required value={toLocal(v.event_at)} onChange={(e) => set('event_at', fromLocal(e.target.value))} /><p className="text-xs text-muted-foreground">The bar shows “x minutes ago” from this.</p></div>}
          <div className="space-y-1.5"><Label htmlFor="expires">{kind === 'breaking' ? 'Hide after' : 'Hide after (optional)'}</Label><Input id="expires" type="datetime-local" required={kind === 'breaking'} value={toLocal(v.expires_at)} onChange={(e) => set('expires_at', fromLocal(e.target.value))} />{kind === 'breaking' && <p className="text-xs text-muted-foreground">At most 48 hours after it happened.</p>}</div>
          <div className="space-y-1.5"><Label htmlFor="order">Order</Label><Input id="order" type="number" value={v.sort_order ?? 0} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} /><p className="text-xs text-muted-foreground">Lower numbers first.</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {([
            ['published', 'Published', 'Shown on the homepage (until it expires).'],
            ['archived', 'Archived', 'Takes it offline without deleting it.'],
          ] as const).map(([k, l, d]) => (
            <div key={k} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={!!v[k]} onCheckedChange={(c) => set(k, c)} aria-label={l} /></div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : isNew ? 'Create entry' : 'Save changes'}</Button>
    </form>
  );
}
