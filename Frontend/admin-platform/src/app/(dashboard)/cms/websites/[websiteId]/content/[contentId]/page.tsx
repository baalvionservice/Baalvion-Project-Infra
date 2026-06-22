'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, ExternalLink } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(contentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (non-secure context) — ignore */
    }
  };

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

  // Canonical public URL for this item, e.g. https://imperialpedia.com/<slug>.
  // `domain` is stored bare (no scheme); normalize and strip any trailing slash.
  const liveBase = website?.domain
    ? `https://${website.domain.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`
    : null;
  const liveUrl = liveBase ? `${liveBase}/${content.slug}` : null;
  const isPublished = content.status === 'published';

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

        {/* Content ID (copyable) + link to the live public page */}
        <div className="ml-auto flex items-center gap-3 pl-3 shrink-0">
          <button
            type="button"
            onClick={copyId}
            title="Copy content ID"
            className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">ID:</span>
            {content.id}
          </button>

          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={
                isPublished
                  ? `Open ${liveUrl}`
                  : `Not published yet — ${liveUrl} may 404 until you publish`
              }
              className={`flex items-center gap-1 text-xs transition-colors hover:underline ${
                isPublished ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View live
            </a>
          )}
        </div>
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
