'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ContentEditor from '@/components/cms/ContentEditor';
import { useContentItem } from '@/lib/queries/cms-content.queries';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { useCmsStore } from '@/lib/store/cmsStore';

export default function ContentEditorPage({
  params,
}: {
  params: Promise<{ websiteId: string; contentId: string }>;
}) {
  const { websiteId, contentId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const setActiveContent = useCmsStore((s) => s.setActiveContent);
  const setActiveWebsiteId = useCmsStore((s) => s.setActiveWebsiteId);
  const clearDraft = useCmsStore((s) => s.clearDraft);

  // Set the active website BEFORE content queries fire so id-only API calls resolve it.
  useEffect(() => { setActiveWebsiteId(websiteId); }, [websiteId, setActiveWebsiteId]);

  const { data: website } = useWebsite(websiteId);
  const { data: content, isLoading } = useContentItem(contentId);

  useEffect(() => {
    setActiveContent(contentId);
    return () => clearDraft();
  }, [contentId, setActiveContent, clearDraft]);

  useEffect(() => {
    if (website && content) {
      setBreadcrumbs([
        { label: 'CMS', href: '/cms' },
        { label: website.name, href: `/cms/websites/${websiteId}` },
        { label: 'Content', href: `/cms/websites/${websiteId}/content` },
        { label: content.title },
      ]);
    }
  }, [website, content, setBreadcrumbs, websiteId]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-32" />
        <div className="space-y-3 mt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Content not found.</p>
        <Button asChild>
          <Link href={`/cms/websites/${websiteId}/content`}>Back to Content</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col -mx-4 -mt-4">
      {/* Minimal back bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
          <Link href={`/cms/websites/${websiteId}/content`}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            {website?.name ?? 'Content'}
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs font-medium truncate">{content.title}</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <ContentEditor
          content={content}
          websiteTitleSuffix={website?.config?.seoDefaults?.titleSuffix}
        />
      </div>
    </div>
  );
}
