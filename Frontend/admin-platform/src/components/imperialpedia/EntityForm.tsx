'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { serviceClients, normalizeError } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { EntityPicker } from './EntityPicker';

// Must match EntityType in the public site's src/types/entity.ts exactly (singular,
// lowercase) — the four page templates (/companies, /countries, /industries,
// /technologies) each only look up entities under one of these literal strings.
// A free-text Type field let a typo ("Company", "companies") create a real row
// that then never appeared anywhere, with no error to explain why.
const ENTITY_TYPES = ['company', 'country', 'industry', 'technology'] as const;

export interface EntityValue {
  type: string;
  name: string;
  slug: string;
  description?: string;
  /**
   * Long-form editorial profile (several paragraphs) — distinct from `description`,
   * which is a single short overview rendered as one pull-quote-style paragraph on
   * the public entity page (see Imperialpedia-main's EntityOverview.tsx) and was
   * never meant to hold real article-length depth. Rendered as its own "About"
   * section on the public page. Stored in `attributes.editorialOverview` (not a
   * base entities column) via the same passthrough every other type-specific
   * field uses.
   */
  editorialOverview?: string;
  category?: string;
  country?: string;
  industry?: string;
  image?: string;
  tags: string[];
  /**
   * Alternate names/spellings/tickers/abbreviations that should resolve to
   * this entity in article entity-mention detection (e.g. "NVIDIA Corp",
   * "NVIDIA Corporation", "NVDA" -> the canonical "NVIDIA" entity) — see
   * Backend/services/knowledge/imperialpedia-service/service/
   * entityMentionDetectionService.js. Editorial data, never inferred.
   */
  aliases?: string[];
  competitors?: string[];
  technologies?: string[];
  /**
   * Every other field the entity API returned that this form has no dedicated control
   * for (founded_year, employees, website, ticker, founders, logo, executives, products,
   * faq, etc. — see CompanyEntity in the public site's src/types/entity.ts). The backend
   * (`upsertEntity`) replaces the entire `attributes` JSONB column with whatever extra
   * top-level fields are in the request body on every save — so a form that only ever
   * sent its own known fields was silently deleting all of these on every edit. Carrying
   * them through unmodified is what makes editing safe.
   */
  extraAttributes?: Record<string, unknown>;
}

const EMPTY: EntityValue = {
  type: '', name: '', slug: '', description: '', editorialOverview: '', category: '',
  country: '', industry: '', image: '', tags: [], aliases: [], competitors: [], technologies: [],
  extraAttributes: {},
};

interface Props { initial?: EntityValue; isEdit?: boolean }

export function EntityForm({ initial, isEdit = false }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<EntityValue>(initial ?? EMPTY);
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(', '));
  const [aliasesText, setAliasesText] = useState((initial?.aliases ?? []).join(', '));
  const [error, setError] = useState<string | null>(null);

  // The API upserts by (type, slug), so those fields define identity and are
  // locked once editing an existing entity to avoid accidentally forking it.
  const set = <K extends keyof EntityValue>(key: K, v: EntityValue[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type: value.type.trim(),
        name: value.name.trim(),
        slug: value.slug.trim() || undefined,
        description: value.description?.trim() || null,
        editorialOverview: value.editorialOverview?.trim() || null,
        category: value.category?.trim() || null,
        country: value.country?.trim() || null,
        industry: value.industry?.trim() || null,
        image: value.image?.trim() || null,
        tags: tagsText.split(',').map((s) => s.trim()).filter(Boolean),
        aliases: aliasesText.split(',').map((s) => s.trim()).filter(Boolean),
        competitors: value.competitors ?? [],
        technologies: value.technologies ?? [],
        // Carry through everything else the entity already had (founded_year, ticker,
        // website, founders, ...) so this save round-trips instead of truncating it.
        ...(value.extraAttributes ?? {}),
      };
      const res = await serviceClients.imperialpedia.post('/entities', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'entities'] });
      router.push('/imperialpedia/entities');
    },
    onError: (err) => setError(normalizeError(err as AxiosError).message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!value.type.trim() || !value.name.trim()) {
      setError('Type and name are required.');
      return;
    }
    if (!isEdit && !value.slug.trim()) {
      setError('Slug is required (it forms the entity identity together with type).');
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <Select value={value.type || undefined} onValueChange={(v) => set('type', v)} disabled={isEdit}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select a type…" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug {isEdit ? '' : <span className="text-muted-foreground">(identity, with type)</span>}</Label>
            <Input id="slug" value={value.slug} onChange={(e) => set('slug', e.target.value)} disabled={isEdit} placeholder="acme-corp" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Acme Corporation" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="description">Description <span className="text-muted-foreground">(short — rendered as a single pull-quote-style overview)</span></Label>
            <Textarea id="description" value={value.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={5} placeholder="Overview of this entity…" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editorial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="editorialOverview">
              Long-form profile <span className="text-muted-foreground">(several paragraphs — rendered as its own "About" section, separate from the short Description above)</span>
            </Label>
            <Textarea
              id="editorialOverview"
              value={value.editorialOverview ?? ''}
              onChange={(e) => set('editorialOverview', e.target.value)}
              rows={16}
              placeholder="A full editorial profile: history, business model, market position, recent developments…"
            />
            {(() => {
              const words = (value.editorialOverview ?? '').trim().split(/\s+/).filter(Boolean).length;
              // Soft nudge only — never blocks saving. Thin entity pages (under ~100
              // words) were the actual root cause of a prior SEO audit finding these
              // pages read as low-value; this keeps that from silently recurring as
              // more entities get added over time.
              const tone = words === 0
                ? 'text-muted-foreground'
                : words < 400
                  ? 'text-amber-600 dark:text-amber-500'
                  : 'text-emerald-600 dark:text-emerald-500';
              const hint = words === 0
                ? 'Empty — the page will show no "About" section at all until this is filled in.'
                : words < 400
                  ? 'Thin — aim for 600+ words of real, specific content (history, business model, recent developments) to avoid a low-value page.'
                  : 'Good length.';
              return (
                <p className={`text-xs ${tone}`}>{words} words — {hint}</p>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={value.category ?? ''} onChange={(e) => set('category', e.target.value)} placeholder="Manufacturing" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" value={value.image ?? ''} onChange={(e) => set('image', e.target.value)} placeholder="https://…/logo.png" />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <EntityPicker
              entityType="country"
              multiple={false}
              value={value.country ? [value.country] : []}
              onChange={(slugs) => set('country', slugs[0] ?? '')}
              placeholder="Search countries…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Industry</Label>
            <EntityPicker
              entityType="industry"
              multiple={false}
              value={value.industry ? [value.industry] : []}
              onChange={(slugs) => set('industry', slugs[0] ?? '')}
              placeholder="Search industries…"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="tags">Tags <span className="text-muted-foreground">(comma-separated)</span></Label>
            <Input id="tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="public, fortune-500" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="aliases">
              Aliases <span className="text-muted-foreground">(comma-separated — alternate names/tickers that should link here in articles)</span>
            </Label>
            <Input id="aliases" value={aliasesText} onChange={(e) => setAliasesText(e.target.value)} placeholder="NVIDIA Corp, NVIDIA Corporation, NVDA" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relationships</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Competitors</Label>
            <EntityPicker
              entityType="company"
              value={value.competitors ?? []}
              onChange={(slugs) => set('competitors', slugs)}
              excludeSlug={value.type === 'company' ? value.slug : undefined}
              placeholder="Search companies…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Technologies</Label>
            <EntityPicker
              entityType="technology"
              value={value.technologies ?? []}
              onChange={(slugs) => set('technologies', slugs)}
              excludeSlug={value.type === 'technology' ? value.slug : undefined}
              placeholder="Search technologies…"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/imperialpedia/entities')}>Cancel</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create entity'}
        </Button>
      </div>
    </form>
  );
}
