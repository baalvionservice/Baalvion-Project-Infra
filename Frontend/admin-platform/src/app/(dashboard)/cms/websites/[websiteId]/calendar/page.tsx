'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import ContentCalendar from '@/components/cms/calendar/ContentCalendar';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useCmsStore } from '@/lib/store/cmsStore';
import { useUIStore } from '@/lib/store/uiStore';

export default function WebsiteCalendarPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const setActiveWebsite = useCmsStore((s) => s.setActiveWebsite);
  const { data: website } = useWebsite(websiteId);
  const canonicalId = website?.id ?? '';

  // Reschedule mutations resolve the website from the cms store, so make sure it's set
  // even when this page is opened directly.
  useEffect(() => {
    if (website) setActiveWebsite(website);
  }, [website, setActiveWebsite]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'Calendar' },
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
          title="Content Calendar"
          description="See scheduled and published content. Drag to reschedule."
        />
      </div>

      {canonicalId ? (
        <ContentCalendar websiteId={websiteId} canonicalId={canonicalId} />
      ) : (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}
    </div>
  );
}
