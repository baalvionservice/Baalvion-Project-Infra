'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { serviceClients } from '@/lib/api/client';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { Skeleton } from '@/components/ui/skeleton';
import { GlossaryTermForm, type GlossaryTermValue } from '@/components/imperialpedia/GlossaryTermForm';

interface TermDetail {
  id: string;
  term: string;
  slug: string;
  short_def: string;
  full_def: string;
  formula_latex?: string | null;
  pronunciation?: string | null;
  aliases?: string[];
  references?: { title: string; url?: string }[];
  difficulty: GlossaryTermValue['difficulty'];
  category?: string | null;
  status: GlossaryTermValue['status'];
  examples?: { title?: string | null; body: string }[];
  relations?: { related_id: string; relation: GlossaryTermValue['relations'][number]['relation'] }[];
}

export default function EditGlossaryTermPage() {
  const params = useParams();
  const id = String(params.id);
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Glossary', href: '/imperialpedia/glossary' },
      { label: 'Edit term' },
    ]);
  }, [setBreadcrumbs]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['imperialpedia', 'glossary', 'detail', id],
    queryFn: () => serviceClients.imperialpedia.get(`/glossary/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });

  const term = data?.data as TermDetail | undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    );
  }

  if (isError || !term) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Term not found.</p>;
  }

  const initial: GlossaryTermValue = {
    id: term.id,
    term: term.term,
    slug: term.slug,
    short_def: term.short_def,
    full_def: term.full_def,
    formula_latex: term.formula_latex ?? '',
    pronunciation: term.pronunciation ?? '',
    aliases: term.aliases ?? [],
    references: term.references ?? [],
    difficulty: term.difficulty,
    category: term.category ?? '',
    status: term.status,
    examples: (term.examples ?? []).map((e) => ({ title: e.title ?? '', body: e.body })),
    relations: (term.relations ?? []).map((r) => ({ related_id: r.related_id, relation: r.relation })),
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${term.term}`} description="Update this glossary term, its examples and related terms." />
      <GlossaryTermForm initial={initial} termId={id} />
    </div>
  );
}
