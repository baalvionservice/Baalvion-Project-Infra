'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { ArticleForm } from '@/components/imperialpedia/ArticleForm';

export default function NewArticlePage() {
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Articles', href: '/imperialpedia/articles' },
      { label: 'New article' },
    ]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-6">
      <PageHeader title="New article" description="Created as a draft — publish when ready." />
      <ArticleForm />
    </div>
  );
}
