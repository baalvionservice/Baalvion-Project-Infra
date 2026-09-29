'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { HomeWidgetForm } from '@/components/law/HomeWidgetForm';
import { useUIStore } from '@/lib/store/uiStore';
import { homeWidgetsApi } from '@/lib/law/legal';

export default function EditHomeWidgetPage() {
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs } = useUIStore();
  const { data: record, isLoading, isError } = useQuery({ queryKey: ['law', 'home-widgets', 'one', id], queryFn: () => homeWidgetsApi.get(id) });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Homepage widgets', href: '/law/home-widgets' }, { label: record?.title ?? 'Edit' }]);
  }, [setBreadcrumbs, record?.title]);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !record) return <p className="py-16 text-center text-sm text-red-600">Not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={record.title} description="Homepage widget entry" />
      <HomeWidgetForm key={`${record.id}-${record.updated_at}`} item={record} />
    </div>
  );
}
