'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { serviceClients } from '@/lib/api/client';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteContentForm, type SiteContentType, type SiteContentValue } from '@/components/imperialpedia/SiteContentForm';

type SiteContentDetail = Record<string, unknown> & {
  type: string;
  name: string;
  slug: string;
};

const KNOWN_FIELDS = new Set(['type', 'name', 'slug', 'description', 'id', 'created_at', 'updated_at', 'tags', 'aliases']);

export default function EditSiteContentPage() {
  const params = useParams();
  const type = decodeURIComponent(String(params.type));
  const slug = decodeURIComponent(String(params.slug));
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Site Content', href: '/imperialpedia/site-content' },
      { label: 'Edit content' },
    ]);
  }, [setBreadcrumbs]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['imperialpedia', 'site-content', 'detail', type, slug],
    queryFn: () =>
      serviceClients.imperialpedia
        .get(`/entities/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`)
        .then((r) => r.data),
    enabled: Boolean(type && slug),
  });

  const entity = data?.data as SiteContentDetail | undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    );
  }

  if (isError || !entity) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Content not found.</p>;
  }

  // Everything that isn't a base entities column is this record's actual
  // content (the fields the public site reads) — round-tripped as-is so
  // editing never silently drops a field the form doesn't have a dedicated
  // control for.
  const attributes = Object.fromEntries(
    Object.entries(entity).filter(([key, val]) => !KNOWN_FIELDS.has(key) && val !== undefined),
  );

  const initial: SiteContentValue = {
    type: entity.type as SiteContentType,
    name: entity.name,
    slug: entity.slug,
    description: (entity.description as string | null | undefined) ?? '',
    attributesJson: JSON.stringify(attributes, null, 2),
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${entity.name}`} description="Update this page's content." />
      <SiteContentForm initial={initial} isEdit />
    </div>
  );
}
