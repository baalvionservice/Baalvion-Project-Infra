'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { serviceClients } from '@/lib/api/client';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { Skeleton } from '@/components/ui/skeleton';
import { EntityForm, type EntityValue } from '@/components/imperialpedia/EntityForm';

interface EntityDetail {
  type: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  country?: string | null;
  industry?: string | null;
  image?: string | null;
  tags?: string[];
}

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

  const initial: EntityValue = {
    type: entity.type,
    name: entity.name,
    slug: entity.slug,
    description: entity.description ?? '',
    category: entity.category ?? '',
    country: entity.country ?? '',
    industry: entity.industry ?? '',
    image: entity.image ?? '',
    tags: entity.tags ?? [],
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${entity.name}`} description="Update this knowledge-graph entity." />
      <EntityForm initial={initial} isEdit />
    </div>
  );
}
