'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { EntertainmentForm } from '@/components/law/EntertainmentForm';
import { useUIStore } from '@/lib/store/uiStore';
import { entertainmentApi } from '@/lib/law/legal';

export default function EditEntertainmentPage() {
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs } = useUIStore();
  const { data: record, isLoading, isError } = useQuery({ queryKey: ['law', 'entertainment', 'one', id], queryFn: () => entertainmentApi.get(id) });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Entertainment', href: '/law/entertainment' }, { label: record?.title ?? 'Edit' }]);
  }, [setBreadcrumbs, record?.title]);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !record) return <p className="py-16 text-center text-sm text-red-600">Not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={record.title} description={`/entertainment/${record.slug}`} />
      {/* key: reload the form when a different record (or a fresh save) arrives */}
      <EntertainmentForm key={`${record.id}-${record.updated_at}`} entry={record} />
    </div>
  );
}
