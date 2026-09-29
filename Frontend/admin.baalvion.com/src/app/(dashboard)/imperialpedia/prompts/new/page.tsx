'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { PromptForm } from '@/components/imperialpedia/PromptForm';

export default function NewPromptPage() {
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Prompts', href: '/imperialpedia/prompts' },
      { label: 'New prompt' },
    ]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-6">
      <PageHeader title="New prompt" description="Build a roundup post — a themed article containing one or more individually copyable prompts, each with its own real example image(s)." />
      <PromptForm />
    </div>
  );
}
