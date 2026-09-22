'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoShowForm } from '@/components/law/VideoShowForm';
import { useUIStore } from '@/lib/store/uiStore';
import { videoShowsApi } from '@/lib/law/legal';

export default function EditVideoShowFormPage() {
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs } = useUIStore();
  const { data: record, isLoading, isError } = useQuery({ queryKey: ['law', 'video-shows', 'one', id], queryFn: () => videoShowsApi.get(id) });
  const label: string = record?.name ?? 'Edit';
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Shows', href: '/law/video-shows' }, { label }]); }, [setBreadcrumbs, label]);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !record) return <p className="py-16 text-center text-sm text-red-600">Not found.</p>;
  return (
    <div className="space-y-6">
      <PageHeader title={label} description="show" />
      <VideoShowForm key={`${record.id}-${record.updated_at}`} item={record} />
    </div>
  );
}
