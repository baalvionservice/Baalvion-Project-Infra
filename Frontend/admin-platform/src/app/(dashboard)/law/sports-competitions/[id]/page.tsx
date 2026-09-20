'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { CompetitionForm } from '@/components/law/CompetitionForm';
import { useUIStore } from '@/lib/store/uiStore';
import { sportsCompetitionsApi } from '@/lib/law/legal';

export default function EditCompetitionPage() {
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs } = useUIStore();
  const { data: record, isLoading, isError } = useQuery({ queryKey: ['law', 'sports-competitions', 'one', id], queryFn: () => sportsCompetitionsApi.get(id) });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Competitions', href: '/law/sports-competitions' }, { label: record?.name ?? 'Edit' }]);
  }, [setBreadcrumbs, record?.name]);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !record) return <p className="py-16 text-center text-sm text-red-600">Not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={record.name} description={`/sports/competitions/${record.slug}`} />
      {/* key: reload the form when a different record (or a fresh save) arrives */}
      <CompetitionForm key={`${record.id}-${record.updated_at}`} competition={record} />
    </div>
  );
}
