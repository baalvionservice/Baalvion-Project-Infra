'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { GlossaryTermForm } from '@/components/imperialpedia/GlossaryTermForm';

export default function NewGlossaryTermPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Glossary', href: '/imperialpedia/glossary' },
      { label: 'New term' },
    ]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-6">
      <PageHeader title="New glossary term" description="Create an Investopedia-style financial term." />
      <GlossaryTermForm />
    </div>
  );
}
