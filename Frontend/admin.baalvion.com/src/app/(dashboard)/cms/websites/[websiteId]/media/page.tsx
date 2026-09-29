'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/common/PageHeader';
import MediaManager from '@/components/cms/media/MediaManager';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useUIStore } from '@/lib/store/uiStore';

export default function WebsiteMediaPage({
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
      { label: 'Media' },
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
          title="Media Library"
          description="Upload and manage images, videos and documents"
          actions={
            <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
              <Info className="h-3 w-3" />
              Shared across your organisation
            </Badge>
          }
        />
      </div>

      {canonicalId ? (
        <MediaManager canonicalId={canonicalId} plan={website?.plan ?? 'pro'} />
      ) : (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}
    </div>
  );
}
