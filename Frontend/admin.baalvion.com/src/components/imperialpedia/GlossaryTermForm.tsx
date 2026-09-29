'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { serviceClients, normalizeError } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const STATUSES = ['draft', 'review', 'published', 'archived'] as const;
const RELATIONS = ['related', 'prerequisite', 'contrast', 'broader', 'narrower'] as const;

type Difficulty = (typeof DIFFICULTIES)[number];
type Status = (typeof STATUSES)[number];
type RelationType = (typeof RELATIONS)[number];

export interface ExampleInput { cid?: string; title?: string; body: string }
export interface RelationInput { cid?: string; related_id: string; relation: RelationType }
export interface ReferenceInput { title: string; url?: string }

export interface GlossaryTermValue {
  id?: string;
  term: string;
  slug?: string;
  short_def: string;
  full_def: string;
  formula_latex?: string;
  pronunciation?: string;
  aliases: string[];
  references: ReferenceInput[];
  difficulty: Difficulty;
  category?: string;
  status: Status;
  examples: ExampleInput[];
  relations: RelationInput[];
}

const EMPTY: GlossaryTermValue = {
  term: '', slug: '', short_def: '', full_def: '', formula_latex: '', pronunciation: '',
  aliases: [], references: [], difficulty: 'beginner', category: '', status: 'draft',
  examples: [], relations: [],
};

// Stable client-only keys so deleting a middle example/relation row doesn't reattach input
// state to the wrong row (the React key={index} gotcha). Stripped before submit.
let _cidSeq = 0;
const cid = () => `row-${++_cidSeq}`;
const withKeys = (v: GlossaryTermValue): GlossaryTermValue => ({
  ...v,
  examples: v.examples.map((e) => ({ ...e, cid: e.cid ?? cid() })),
  relations: v.relations.map((r) => ({ ...r, cid: r.cid ?? cid() })),
});

const referencesToText = (refs: ReferenceInput[]) => refs.map((r) => (r.url ? `${r.title} | ${r.url}` : r.title)).join('\n');
const textToReferences = (text: string): ReferenceInput[] =>
  text.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
    const idx = line.indexOf('|'); // split on the FIRST pipe only (titles may contain '|')
    if (idx === -1) return { title: line };
    const title = line.slice(0, idx).trim();
    const url = line.slice(idx + 1).trim();
    return url ? { title, url } : { title };
  });

interface Props { initial?: GlossaryTermValue; termId?: string }

export function GlossaryTermForm({ initial, termId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<GlossaryTermValue>(initial ? withKeys(initial) : EMPTY);
  const [aliasesText, setAliasesText] = useState((initial?.aliases ?? []).join(', '));
  const [referencesText, setReferencesText] = useState(referencesToText(initial?.references ?? []));
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(termId);
  const set = <K extends keyof GlossaryTermValue>(key: K, v: GlossaryTermValue[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  // All terms (for the relations picker). Admin bearer is attached → sees every status.
  const { data: allTerms } = useQuery({
    queryKey: ['imperialpedia', 'glossary', 'all'],
    queryFn: () => serviceClients.imperialpedia.get('/glossary', { params: { status: 'all', limit: 200 } }).then((r) => r.data),
  });
  const termOptions = useMemo(() => {
    const items = (allTerms?.data?.items ?? []) as Array<{ id: string; term: string }>;
    return items.filter((t) => t.id !== termId);
  }, [allTerms, termId]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        term: value.term,
        slug: value.slug || undefined,
        short_def: value.short_def,
        full_def: value.full_def,
        formula_latex: value.formula_latex || null,
        pronunciation: value.pronunciation || null,
        aliases: aliasesText.split(',').map((s) => s.trim()).filter(Boolean),
        references: textToReferences(referencesText),
        difficulty: value.difficulty,
        category: value.category || null,
        status: value.status,
        examples: value.examples.filter((e) => e.body.trim()).map((e, i) => ({ title: e.title || null, body: e.body, sort_order: i })),
        relations: value.relations.filter((r) => r.related_id).map((r) => ({ related_id: r.related_id, relation: r.relation })),
      };
      const client = serviceClients.imperialpedia;
      const res = isEdit ? await client.patch(`/glossary/${termId}`, payload) : await client.post('/glossary', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'glossary'] });
      router.push('/imperialpedia/glossary');
    },
    onError: (err) => setError(normalizeError(err as AxiosError).message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!value.term.trim() || !value.short_def.trim() || !value.full_def.trim()) {
      setError('Term, short definition and full definition are required.');
      return;
    }
    mutation.mutate();
  };

  const addExample = () => set('examples', [...value.examples, { cid: cid(), title: '', body: '' }]);
  const updateExample = (i: number, patch: Partial<ExampleInput>) =>
    set('examples', value.examples.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const removeExample = (i: number) => set('examples', value.examples.filter((_, idx) => idx !== i));

  const addRelation = () => set('relations', [...value.relations, { cid: cid(), related_id: '', relation: 'related' }]);
  const updateRelation = (i: number, patch: Partial<RelationInput>) =>
    set('relations', value.relations.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRelation = (i: number) => set('relations', value.relations.filter((_, idx) => idx !== i));

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardHeader><CardTitle>Definition</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="term">Term</Label>
            <Input id="term" value={value.term} onChange={(e) => set('term', e.target.value)} placeholder="Compound Interest" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug <span className="text-muted-foreground">(optional, auto from term)</span></Label>
            <Input id="slug" value={value.slug ?? ''} onChange={(e) => set('slug', e.target.value)} placeholder="compound-interest" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={value.category ?? ''} onChange={(e) => set('category', e.target.value)} placeholder="Investing Basics" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="short_def">Short definition <span className="text-muted-foreground">(tooltip, ≤ 320 chars · {value.short_def.length}/320)</span></Label>
            <Textarea id="short_def" maxLength={320} value={value.short_def} onChange={(e) => set('short_def', e.target.value)} rows={2} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="full_def">Full definition</Label>
            <Textarea id="full_def" value={value.full_def} onChange={(e) => set('full_def', e.target.value)} rows={5} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="formula">Formula (LaTeX)</Label>
            <Input id="formula" value={value.formula_latex ?? ''} onChange={(e) => set('formula_latex', e.target.value)} placeholder="A = P(1 + r/n)^{nt}" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pron">Pronunciation</Label>
            <Input id="pron" value={value.pronunciation ?? ''} onChange={(e) => set('pronunciation', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <Select value={value.difficulty} onValueChange={(v) => set('difficulty', v as Difficulty)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={value.status} onValueChange={(v) => set('status', v as Status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aliases">Aliases <span className="text-muted-foreground">(comma-separated)</span></Label>
            <Input id="aliases" value={aliasesText} onChange={(e) => setAliasesText(e.target.value)} placeholder="PE, P/E ratio" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="refs">References <span className="text-muted-foreground">(one per line: Title | https://url)</span></Label>
            <Textarea id="refs" value={referencesText} onChange={(e) => setReferencesText(e.target.value)} rows={3} placeholder="U.S. SEC — Compound Interest | https://investor.gov/..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Examples</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addExample}><Plus className="mr-1 h-3.5 w-3.5" /> Add example</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {value.examples.length === 0 && <p className="text-sm text-muted-foreground">No examples yet.</p>}
          {value.examples.map((ex, i) => (
            <div key={ex.cid ?? i} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Input value={ex.title ?? ''} onChange={(e) => updateExample(i, { title: e.target.value })} placeholder="Example title (optional)" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeExample(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <Textarea value={ex.body} onChange={(e) => updateExample(i, { body: e.target.value })} rows={2} placeholder="Worked example…" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Related terms</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addRelation}><Plus className="mr-1 h-3.5 w-3.5" /> Add relation</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {value.relations.length === 0 && <p className="text-sm text-muted-foreground">No related terms linked.</p>}
          {value.relations.map((rel, i) => (
            <div key={rel.cid ?? i} className="flex items-center gap-2">
              <Select value={rel.related_id} onValueChange={(v) => updateRelation(i, { related_id: v })}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select a term…" /></SelectTrigger>
                <SelectContent>{termOptions.map((t) => <SelectItem key={t.id} value={t.id}>{t.term}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={rel.relation} onValueChange={(v) => updateRelation(i, { relation: v as RelationType })}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>{RELATIONS.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeRelation(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/imperialpedia/glossary')}>Cancel</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create term'}
        </Button>
      </div>
    </form>
  );
}
