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

// These are the entity `type` values the public Imperialpedia site actually
// reads content back out of (see Imperialpedia-main's src/lib/data/site-content.ts).
// Free-text `type` on entities is technically possible at the API level, but a
// typo here just as silently produces a row nothing ever reads — same failure
// mode EntityForm.tsx already documents for company/country/industry/technology
// — so this stays a closed list matching the frontend's read side exactly.
export const SITE_CONTENT_TYPES = [
  'financial-tool',
  'stock-list',
  'market-index',
  'topic-hub',
  'latest-category',
] as const;
export type SiteContentType = (typeof SITE_CONTENT_TYPES)[number];

// Slug conventions for each type, shown as a hint — these must match what the
// public site requests (tool route segment, list slug, index slug, topic-config
// slug, or the LiveCategory value lowercased, respectively).
const SLUG_HINT: Record<SiteContentType, string> = {
  'financial-tool': 'e.g. "compound-interest" (must match the /financial-tools/<slug> route)',
  'stock-list': 'e.g. "dividend-stocks" (must match the /stocks/lists/<slug> route)',
  'market-index': 'e.g. "sp-500" (must match the /stocks/indexes/<slug> route)',
  'topic-hub': 'e.g. "inflation" (must match the topic page slug, e.g. /inflation)',
  'latest-category': 'lowercase LiveCategory value, e.g. "markets", "personalfinance"',
};

// Starter JSON shown when switching type on a new record, so the admin doesn't
// need separate documentation to know which keys the public site reads.
const ATTRIBUTES_TEMPLATE: Record<SiteContentType, unknown> = {
  'financial-tool': {
    intro: 'One or two sentences on what this calculator does and why it matters.',
    formula: 'A = P × (1 + r/n)^(n×t)',
    formulaLegend: [{ symbol: 'A', meaning: 'what this variable represents' }],
    howItWorks: ['A paragraph explaining how the calculator applies the formula.'],
    example: {
      title: 'Worked example title',
      steps: ['Step 1 with real numbers', 'Step 2 with real numbers'],
      result: 'The final, stated result of the worked example.',
    },
    faq: [{ question: 'A common question', answer: 'A factual answer.' }],
  },
  'stock-list': {
    longDescription: 'A real paragraph (roughly 80-150 words) about this list — what defines membership, what to evaluate, and typical risks.',
  },
  'market-index': {
    investorNote: 'A real paragraph (roughly 80-130 words) on how investors typically use or interpret this index.',
  },
  'topic-hub': {
    intro: 'A real paragraph (roughly 90-140 words) explaining this topic, independent of any articles published under it.',
  },
  'latest-category': {
    title: 'Live <Category> News',
    intro: 'A real paragraph on what this live feed covers and how to use it.',
  },
};

export interface SiteContentValue {
  type: SiteContentType | '';
  name: string;
  slug: string;
  description?: string;
  attributesJson: string;
}

const EMPTY: SiteContentValue = { type: '', name: '', slug: '', description: '', attributesJson: '' };

interface Props { initial?: SiteContentValue; isEdit?: boolean }

export function SiteContentForm({ initial, isEdit = false }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<SiteContentValue>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof SiteContentValue>(key: K, v: SiteContentValue[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  const applyTemplate = (type: SiteContentType) => {
    set('type', type);
    if (!value.attributesJson.trim()) {
      set('attributesJson', JSON.stringify(ATTRIBUTES_TEMPLATE[type], null, 2));
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let attributes: Record<string, unknown>;
      try {
        attributes = value.attributesJson.trim() ? JSON.parse(value.attributesJson) : {};
      } catch {
        throw new Error('Content (JSON) is not valid JSON — check for a missing comma or quote.');
      }
      if (Array.isArray(attributes) || typeof attributes !== 'object' || attributes === null) {
        throw new Error('Content (JSON) must be a JSON object, e.g. { "intro": "..." }.');
      }
      const payload = {
        type: value.type,
        name: value.name.trim(),
        slug: value.slug.trim() || undefined,
        description: value.description?.trim() || null,
        ...attributes,
      };
      const res = await serviceClients.imperialpedia.post('/entities', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'site-content'] });
      router.push('/imperialpedia/site-content');
    },
    onError: (err) => setError((err as Error).message ?? normalizeError(err as AxiosError).message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!value.type) {
      setError('Content type is required.');
      return;
    }
    if (!value.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!isEdit && !value.slug.trim()) {
      setError('Slug is required — it must match the URL segment the public page reads.');
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
            <Label htmlFor="type">Content type</Label>
            <Select
              value={value.type || undefined}
              onValueChange={(v) => applyTemplate(v as SiteContentType)}
              disabled={isEdit}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select a content type…" />
              </SelectTrigger>
              <SelectContent>
                {SITE_CONTENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={value.slug} onChange={(e) => set('slug', e.target.value)} disabled={isEdit} placeholder="dividend-stocks" />
            {value.type && <p className="text-xs text-muted-foreground">{SLUG_HINT[value.type]}</p>}
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="name">Name <span className="text-muted-foreground">(internal label, shown in the admin list)</span></Label>
            <Input id="name" value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Dividend Stocks" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="description">Description <span className="text-muted-foreground">(optional, internal notes only — not necessarily rendered)</span></Label>
            <Textarea id="description" value={value.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content (JSON)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            The exact fields the public page reads for this content type. Selecting a type above fills in a
            starter template with the expected keys — replace the placeholder text with real content and keep
            the same key names.
          </p>
          <Textarea
            id="attributesJson"
            value={value.attributesJson}
            onChange={(e) => set('attributesJson', e.target.value)}
            rows={20}
            className="font-mono text-xs"
            placeholder='{ "intro": "..." }'
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/imperialpedia/site-content')}>Cancel</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create content'}
        </Button>
      </div>
    </form>
  );
}
