'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { serviceClients } from '@/lib/api/client';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { Skeleton } from '@/components/ui/skeleton';
import { EntityForm, type EntityValue } from '@/components/imperialpedia/EntityForm';

// Loose shape: the API flattens the entity's type-specific `attributes` JSONB back to
// top-level (see entitiesController.js `serialize()`), so a real entity can carry many
// more fields than the ones this admin form has dedicated controls for (founded_year,
// employees, website, ticker, founders, logo, executives, products, faq, ...). Typing
// this as `Record<string, unknown>` rather than a fixed interface is what lets the edit
// page preserve those fields into `extraAttributes` instead of silently discarding them.
type EntityDetail = Record<string, unknown> & {
  type: string;
  name: string;
  slug: string;
};

const KNOWN_FIELDS = new Set([
  'type', 'name', 'slug', 'description', 'category', 'country', 'industry',
  'image', 'tags', 'competitors', 'technologies', 'id', 'created_at', 'updated_at',
]);

export default function EditEntityPage() {
  const params = useParams();
  const type = decodeURIComponent(String(params.type));
  const slug = decodeURIComponent(String(params.slug));
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Entities', href: '/imperialpedia/entities' },
      { label: 'Edit entity' },
    ]);
  }, [setBreadcrumbs]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['imperialpedia', 'entities', 'detail', type, slug],
    queryFn: () =>
      serviceClients.imperialpedia
        .get(`/entities/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`)
        .then((r) => r.data),
    enabled: Boolean(type && slug),
  });

  const entity = data?.data as EntityDetail | undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    );
  }

  if (isError || !entity) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Entity not found.</p>;
  }

  const extraAttributes = Object.fromEntries(
    Object.entries(entity).filter(([key, val]) => !KNOWN_FIELDS.has(key) && val !== undefined),
  );

  const initial: EntityValue = {
    type: entity.type,
    name: entity.name,
    slug: entity.slug,
    description: (entity.description as string | null | undefined) ?? '',
    category: (entity.category as string | null | undefined) ?? '',
    country: (entity.country as string | null | undefined) ?? '',
    industry: (entity.industry as string | null | undefined) ?? '',
    image: (entity.image as string | null | undefined) ?? '',
    tags: (entity.tags as string[] | undefined) ?? [],
    competitors: (entity.competitors as string[] | undefined) ?? [],
    technologies: (entity.technologies as string[] | undefined) ?? [],
    extraAttributes,
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${entity.name}`} description="Update this knowledge-graph entity." />
      <EntityForm initial={initial} isEdit />
    </div>
  );
}
