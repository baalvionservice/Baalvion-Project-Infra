import React from 'react';
import type { ReviewedByInfo } from '@/components/knowledge/ReviewedBy';

interface EditorialInformationProps {
  authorName: string;
  reviewedBy?: ReviewedByInfo;
  /** Omitted when the article has no real timestamp -- see ArticleMetaHeader.tsx. */
  updatedAt?: string;
  sourcesCount: number;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-3 border-b border-slate-100 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-[13.5px] font-semibold text-slate-700 text-right">{value}</span>
    </div>
  );
}

/**
 * Compact recap card at the end of the article -- same real, already-resolved
 * values as the metadata header and attribution block up top (no new data,
 * no new lookups), just summarized once more where a reader who scrolled
 * straight to the bottom can still see who wrote it, whether it was reviewed,
 * when it changed, and whether it cites sources. "Sources checked" reflects
 * PrimarySources.tsx's own standing rule (each url verified to exist before
 * being added, see its doc comment) -- it reports a real count, or says
 * plainly that none are on file yet, never a vague fabricated "yes."
 */
export function EditorialInformation({ authorName, reviewedBy, updatedAt, sourcesCount }: EditorialInformationProps) {
  return (
    <div className="border border-slate-200 rounded-lg px-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-900 pt-5 pb-1">
        Editorial information
      </h2>
      <Row label="Written by" value={authorName} />
      <Row
        label="Reviewed by"
        value={reviewedBy ? reviewedBy.name : 'Not independently reviewed by a licensed attorney'}
      />
      {updatedAt && <Row label="Last updated" value={updatedAt} />}
      <Row
        label="Sources checked"
        value={sourcesCount > 0 ? `${sourcesCount} verified source${sourcesCount === 1 ? '' : 's'} cited` : 'None on file yet'}
      />
    </div>
  );
}
