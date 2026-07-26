'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useContentList } from '@/lib/queries/cms-content.queries';
import { buildImperialpediaPath } from '@/lib/newsroom/public-url';
import { formatRelative } from '@/lib/utils/format';
import type { ContentItem } from '@/lib/types/cms-content.types';

interface CategoryRef {
  id: string;
  slug: string;
  parentId: string | null;
  name: string;
}

interface Props {
  websiteId: string;
  websiteSlug?: string;
  websiteDomain?: string | null;
  /** Category to find related content in — usually the draft's primary topic or region. */
  categoryId?: string;
  excludeContentId?: string;
  categories: CategoryRef[];
}

/**
 * Surfaces other published content (news AND content-engine education guides,
 * both are just `type` values on the same CMS content table) that share the
 * current draft's topic/region, so editors can link related coverage from
 * within the article body without leaving the page to go search for it.
 */
export default function RelatedContentSuggestions({ websiteId, websiteSlug, websiteDomain, categoryId, excludeContentId, categories }: Props) {
  const { data, isLoading } = useContentList(
    { websiteId, categoryId, status: 'published', limit: 8, sortBy: 'updatedAt', sortDir: 'desc' },
  );
  const items = (data?.data ?? []).filter((i) => i.id !== excludeContentId).slice(0, 6);

  if (!categoryId) {
    return <p className="text-[11px] text-muted-foreground">Pick a topic or region to see related content you can link to.</p>;
  }
  if (isLoading) {
    return <p className="text-[11px] text-muted-foreground">Finding related content…</p>;
  }
  if (!items.length) {
    return <p className="text-[11px] text-muted-foreground">No other published content in this topic yet.</p>;
  }

  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <SuggestionRow key={item.id} item={item} websiteSlug={websiteSlug} websiteDomain={websiteDomain} categories={categories} />
      ))}
    </div>
  );
}

function SuggestionRow({
  item, websiteSlug, websiteDomain, categories,
}: { item: ContentItem; websiteSlug?: string; websiteDomain?: string | null; categories: CategoryRef[] }) {
  const [copied, setCopied] = useState(false);

  const path = websiteSlug === 'imperialpedia'
    ? buildImperialpediaPath({ slug: item.slug, dateSource: item.publishedAt, categoryIds: item.categoryIds, categories })
    : `/${item.slug}`;
  const fullUrl = websiteDomain ? `https://${websiteDomain}${path}` : path;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (non-secure context) — ignore */
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{item.title}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {item.type === 'news' ? 'News' : 'Guide'} · Updated {formatRelative(item.updatedAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={copyLink}
        title="Copy link to paste into the body"
        className="shrink-0 rounded p-1 hover:bg-muted"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}
