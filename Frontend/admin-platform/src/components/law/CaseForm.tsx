'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { normalizeError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListEditor } from './ListEditor';
import { CASE_STATUSES, casesApi, courtsApi, rowsOf, slugify, type CaseRecord, type CourtRecord } from '@/lib/law/legal';

const SELECT = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';
type Row = Record<string, unknown>;

const blank = (rows: Row[] | undefined) => (rows ?? []).filter((r) => Object.values(r).some((v) => v !== undefined && v !== ''));
const PEOPLE_COLUMNS = [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role, e.g. Plaintiff' }, { key: 'personSlug', label: 'Profile slug (optional)', width: 'w-56' }];

const EMPTY: Partial<CaseRecord> = {
  slug: '', case_name: '', court_slug: '', jurisdiction: '', status: 'concluded', summary: '',
  parties: [], lawyers: [], judges: [], important_dates: [], timeline: [], documents: [], related_article_slugs: [],
  published: false, indexable: false, verified: false, archived: false,
};

export function CaseForm({ legalCase }: { legalCase?: CaseRecord }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = !legalCase;
  const [v, setV] = useState<Partial<CaseRecord>>(legalCase ?? EMPTY);
  const [related, setRelated] = useState((legalCase?.related_article_slugs ?? []).join(', '));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof CaseRecord>(k: K, val: CaseRecord[K] | null) => { setSaved(false); setV((p) => ({ ...p, [k]: val })); };
  const text = (k: keyof CaseRecord) => (v[k] as string | null | undefined) ?? '';

  const { data: courts = [] } = useQuery({ queryKey: ['law', 'courts', 'all'], queryFn: () => courtsApi.list({ limit: 200 }).then((d) => rowsOf<CourtRecord>(d)) });

  const save = useMutation({
    mutationFn: () => {
      const body: Partial<CaseRecord> = {
        ...v,
        parties: blank(v.parties), lawyers: blank(v.lawyers), judges: blank(v.judges),
        important_dates: blank(v.important_dates), timeline: blank(v.timeline), documents: blank(v.documents),
        related_article_slugs: related.split(',').map((s) => slugify(s)).filter(Boolean),
        country_code: v.country_code ? String(v.country_code).toUpperCase() : null,
      };
      delete (body as Partial<CaseRecord> & { id?: number }).id;
      delete body.updated_at;
      return isNew ? casesApi.create(body) : casesApi.update(legalCase!.id, body);
    },
    onSuccess: (row) => { setError(null); setSaved(true); qc.invalidateQueries({ queryKey: ['law', 'cases'] }); if (isNew) router.replace(`/law/cases/${row.id}`); },
    onError: (e) => { setSaved(false); setError(normalizeError(e as AxiosError).message); },
  });

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved. The website refreshes within moments if live updates are configured.</div>}

      <Card>
        <CardHeader><CardTitle>Case</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="case_name">Case name</Label><Input id="case_name" required value={text('case_name')} onChange={(e) => { set('case_name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">URL slug</Label>
            <Input id="slug" required disabled={!isNew} value={text('slug')} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
            <p className="text-xs text-muted-foreground">{isNew ? 'Becomes /legal/cases/{slug}. Cannot be changed later.' : 'Fixed: the URL is live.'}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="court_slug">Court</Label>
            <select id="court_slug" required className={SELECT} value={text('court_slug')} onChange={(e) => set('court_slug', e.target.value)}>
              <option value="">Choose a court…</option>
              {courts.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="status">Status</Label><select id="status" className={SELECT} value={text('status')} onChange={(e) => set('status', e.target.value)}>{CASE_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="space-y-1.5"><Label htmlFor="country_code">Country (2-letter code)</Label><Input id="country_code" maxLength={2} value={text('country_code')} onChange={(e) => set('country_code', e.target.value.toUpperCase() || null)} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="jurisdiction">Jurisdiction</Label><Input id="jurisdiction" placeholder="e.g. United States, Federal" value={text('jurisdiction')} onChange={(e) => set('jurisdiction', e.target.value)} /></div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea id="summary" rows={8} value={text('summary')} onChange={(e) => set('summary', e.target.value)} />
            <p className="text-xs text-muted-foreground">Factual and neutral, in your own words. Cases framed around political parties or campaigns do not belong here.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>People</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <ListEditor label="Parties" columns={PEOPLE_COLUMNS} rows={(v.parties ?? []) as Row[]} onChange={(r) => set('parties', r)} />
          <ListEditor label="Lawyers" columns={PEOPLE_COLUMNS} rows={(v.lawyers ?? []) as Row[]} onChange={(r) => set('lawyers', r)} />
          <ListEditor label="Judges" hint="A profile slug links the name to that person’s page and connects the case to them." columns={PEOPLE_COLUMNS} rows={(v.judges ?? []) as Row[]} onChange={(r) => set('judges', r)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Dates and documents</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <ListEditor label="Important dates" hint="YYYY, YYYY-MM or YYYY-MM-DD." columns={[{ key: 'date', label: 'Date', width: 'w-36' }, { key: 'label', label: 'e.g. Decided' }]} rows={(v.important_dates ?? []) as Row[]} onChange={(r) => set('important_dates', r)} />
          <ListEditor label="Timeline" columns={[{ key: 'date', label: 'Date', width: 'w-36' }, { key: 'title', label: 'What happened' }, { key: 'description', label: 'Detail (optional)' }]} rows={(v.timeline ?? []) as Row[]} onChange={(r) => set('timeline', r)} />
          <ListEditor label="Documents" hint="Only real, public sources: judgments, filings, rulings. https links only." columns={[{ key: 'title', label: 'Title' }, { key: 'type', label: 'Type, e.g. Opinion', width: 'w-44' }, { key: 'url', label: 'https://…', type: 'url' }]} rows={(v.documents ?? []) as Row[]} onChange={(r) => set('documents', r)} />
          <div className="space-y-1.5">
            <Label htmlFor="related">Related articles (slugs, comma separated)</Label>
            <Input id="related" value={related} onChange={(e) => { setSaved(false); setRelated(e.target.value); }} />
            <p className="text-xs text-muted-foreground">Optional. Articles that name this case are connected automatically, so this only pins extra ones.</p>
          </div>
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
            ['indexable', 'Allow search engines', 'Adds the page to the sitemap. Turn on once the summary is original and sourced.'],
            ['verified', 'Reviewed by an editor', 'Shows the verified badge.'],
            ['archived', 'Archived', 'Takes the case offline without deleting it (also hides the website’s built-in copy).'],
          ] as const).map(([k, l, d]) => (
            <div key={k} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={!!v[k]} onCheckedChange={(c) => set(k, c)} aria-label={l} /></div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : isNew ? 'Create case' : 'Save changes'}</Button>
    </form>
  );
}
