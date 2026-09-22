'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { ShowParticipantForm } from '@/components/law/ShowParticipantForm';
import { useUIStore } from '@/lib/store/uiStore';
import { showParticipantsApi } from '@/lib/law/legal';

export default function EditShowPersonPage() {
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs } = useUIStore();
  const { data: record, isLoading, isError } = useQuery({ queryKey: ['law', 'show-people', 'one', id], queryFn: () => showParticipantsApi.get(id) });
  const label: string = record?.name ?? 'Edit';
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Show people', href: '/law/show-people' }, { label }]); }, [setBreadcrumbs, label]);
  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !record) return <p className="py-16 text-center text-sm text-red-600">Not found.</p>;
  return (
    <div className="space-y-6">
      <PageHeader title={label} description="Profile of someone who took part in a show" />
      <ShowParticipantForm key={`${record.id}-${record.updated_at}`} item={record} />
    </div>
  );
}
