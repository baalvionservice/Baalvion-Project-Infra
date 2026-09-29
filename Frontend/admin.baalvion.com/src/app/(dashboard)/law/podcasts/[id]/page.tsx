'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { PodcastShowForm } from '@/components/law/PodcastShowForm';
import { useUIStore } from '@/lib/store/uiStore';
import { podcastShowsApi } from '@/lib/law/legal';

export default function EditPodcastPage() {
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs } = useUIStore();
  const { data: record, isLoading, isError } = useQuery({ queryKey: ['law', 'podcast-shows', 'one', id], queryFn: () => podcastShowsApi.get(id) });
  const label: string = record?.title ?? 'Edit';
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Podcasts', href: '/law/podcasts' }, { label }]); }, [setBreadcrumbs, label]);
  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !record) return <p className="py-16 text-center text-sm text-red-600">Not found.</p>;
  return (
    <div className="space-y-6">
      <PageHeader title={label} description="Podcast entry" />
      <PodcastShowForm key={`${record.id}-${record.updated_at}`} item={record} />
    </div>
  );
}
