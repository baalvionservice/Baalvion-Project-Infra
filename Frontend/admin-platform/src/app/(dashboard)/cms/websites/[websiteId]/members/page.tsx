'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import UsersManager from '@/components/cms/users/UsersManager';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useUIStore } from '@/lib/store/uiStore';

export default function WebsiteMembersPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const { data: website } = useWebsite(websiteId);
  const canonicalId = website?.id ?? '';

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'Users' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href={`/cms/websites/${websiteId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {website?.name ?? 'Website'}
          </Link>
        </Button>
        <PageHeader
          title="User Management"
          description={`Manage who can access ${website?.name ?? 'this website'}, their roles and account status`}
        />
      </div>

      {canonicalId ? (
        <UsersManager websiteId={websiteId} canonicalId={canonicalId} />
      ) : (
        <p className="text-sm text-muted-foreground">Loading website…</p>
      )}
    </div>
  );
}
