'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonForm } from '@/components/law/PersonForm';
import { useUIStore } from '@/lib/store/uiStore';
import { peopleApi } from '@/lib/law/people';

export default function EditPersonPage() {
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs } = useUIStore();
  const { data: person, isLoading, isError } = useQuery({ queryKey: ['law', 'people', 'one', id], queryFn: () => peopleApi.get(id) });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'People', href: '/law/people' }, { label: person?.full_name ?? 'Edit' }]);
  }, [setBreadcrumbs, person?.full_name]);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !person) return <p className="py-16 text-center text-sm text-red-600">Profile not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={person.display_name || person.full_name} description={`/people/${person.slug}`} />
      {/* key: reload the form when a different record (or a fresh save) arrives */}
      <PersonForm key={`${person.id}-${person.updated_at}`} person={person} />
    </div>
  );
}
