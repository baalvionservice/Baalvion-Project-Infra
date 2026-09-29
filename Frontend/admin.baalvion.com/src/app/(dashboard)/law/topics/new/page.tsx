'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { TopicForm } from '@/components/law/TopicForm';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewTopicPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Topics', href: '/law/topics' }, { label: 'New' }]); }, [setBreadcrumbs]);
  return (
    <div className="space-y-6">
      <PageHeader title="New topic" description="Create a draft. It stays hidden until you publish it." />
      <TopicForm />
    </div>
  );
}
