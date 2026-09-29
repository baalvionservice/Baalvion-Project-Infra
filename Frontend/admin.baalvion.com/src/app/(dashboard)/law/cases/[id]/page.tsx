'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { CaseForm } from '@/components/law/CaseForm';
import { useUIStore } from '@/lib/store/uiStore';
import { casesApi } from '@/lib/law/legal';

export default function EditCasePage() {
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs } = useUIStore();
  const { data: record, isLoading, isError } = useQuery({ queryKey: ['law', 'cases', 'one', id], queryFn: () => casesApi.get(id) });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Cases', href: '/law/cases' }, { label: record?.case_name ?? 'Edit' }]);
  }, [setBreadcrumbs, record?.case_name]);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !record) return <p className="py-16 text-center text-sm text-red-600">Not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={record.case_name} description={`/legal/cases/${record.slug}`} />
      {/* key: reload the form when a different record (or a fresh save) arrives */}
      <CaseForm key={`${record.id}-${record.updated_at}`} legalCase={record} />
    </div>
  );
}
