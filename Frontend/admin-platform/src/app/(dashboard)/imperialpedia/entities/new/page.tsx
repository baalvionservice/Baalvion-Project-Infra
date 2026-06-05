'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { EntityForm } from '@/components/imperialpedia/EntityForm';

export default function NewEntityPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Entities', href: '/imperialpedia/entities' },
      { label: 'New entity' },
    ]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-6">
      <PageHeader title="New entity" description="Create a structured knowledge-graph entity." />
      <EntityForm />
    </div>
  );
}
