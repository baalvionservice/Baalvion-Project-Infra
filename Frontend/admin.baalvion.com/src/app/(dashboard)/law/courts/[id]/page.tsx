'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { CourtForm } from '@/components/law/CourtForm';
import { useUIStore } from '@/lib/store/uiStore';
import { courtsApi } from '@/lib/law/legal';

export default function EditCourtPage() {
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs } = useUIStore();
  const { data: record, isLoading, isError } = useQuery({ queryKey: ['law', 'courts', 'one', id], queryFn: () => courtsApi.get(id) });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Courts', href: '/law/courts' }, { label: record?.name ?? 'Edit' }]);
  }, [setBreadcrumbs, record?.name]);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !record) return <p className="py-16 text-center text-sm text-red-600">Not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={record.name} description={`/legal/courts/${record.slug}`} />
      {/* key: reload the form when a different record (or a fresh save) arrives */}
      <CourtForm key={`${record.id}-${record.updated_at}`} court={record} />
    </div>
  );
}
