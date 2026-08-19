import React from 'react';

interface ArticleMetaHeaderProps {
  /** article.country -- omitted entirely for worldwide-general guides that carry no real jurisdiction. */
  jurisdiction?: string;
  /** article.category.name -- this site's own "Practice Area" naming convention (see [categorySlug]/page.tsx). */
  practiceArea?: string;
  /** Same real timestamp as `updated` when the source data tracks only one date -- see ArticleMetaHeader doc comment. */
  published?: string;
  updated?: string;
  /** Computed live from the article's real word count, not a stored/default guess -- see ArticleView.tsx. */
  readingTimeMinutes: number;
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[12.5px] leading-tight">
      <span className="text-slate-400">{label}: </span>
      <span className="font-semibold text-slate-700">{value}</span>
    </div>
  );
}

/**
 * Fixed metadata header every article shows at the top: Jurisdiction,
 * Practice Area, Published, Last Updated, Reviewed by (rendered separately,
 * immediately below this -- see ArticleView.tsx), Reading time. Each field
 * only renders when the underlying value is real; see the doc comments on
 * the props above for what's known vs. computed vs. omitted.
 */
export function ArticleMetaHeader({ jurisdiction, practiceArea, published, updated, readingTimeMinutes }: ArticleMetaHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 border-y border-slate-100">
      {jurisdiction && <MetaItem label="Jurisdiction" value={jurisdiction} />}
      {practiceArea && <MetaItem label="Practice Area" value={practiceArea} />}
      {published && <MetaItem label="Published" value={published} />}
      {updated && <MetaItem label="Last Updated" value={updated} />}
      <MetaItem label="Reading time" value={`${readingTimeMinutes} min`} />
    </div>
  );
}
