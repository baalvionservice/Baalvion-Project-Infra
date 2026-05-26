'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useUIStore } from '@/lib/store/uiStore';

// Re-uses the global media library page with website context
export default function WebsiteMediaPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const { data: website } = useWebsite(websiteId);

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
          description={`Assets for ${website?.name ?? '...'}`}
        />
      </div>

      {/* Redirect note — the global /media page handles all media */}
      <div className="rounded-lg border bg-muted/30 p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Media for all websites is managed in the global Media Library.
        </p>
        <Button asChild>
          <Link href="/media">Open Media Library</Link>
        </Button>
      </div>
    </div>
  );
}
