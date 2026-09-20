'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { PersonForm } from '@/components/law/PersonForm';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewPersonPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'People', href: '/law/people' }, { label: 'New' }]); }, [setBreadcrumbs]);
  return (
    <div className="space-y-6">
      <PageHeader title="New profile" description="Create a draft. It stays hidden until you publish it." />
      <PersonForm />
    </div>
  );
}
