import React from 'react';
import { BadgeCheck } from 'lucide-react';

export interface ReviewedByInfo {
  name: string;
  jurisdiction?: string;
  barLicense?: string;
  reviewDate: string;
}

/**
 * Attorney-review credit line. Renders nothing when `info` is absent -- see
 * the `reviewedBy` doc comment on LawArticle and /editorial-process: this
 * network only claims named-attorney review where it has actually happened,
 * never as a default "reviewed by our team" placeholder.
 */
export function ReviewedBy({ info }: { info?: ReviewedByInfo }) {
  if (!info) return null;

  return (
    <div className="flex items-start gap-2.5 text-[13px] text-slate-600 bg-blue-50/60 border border-blue-100 rounded-lg px-4 py-3">
      <BadgeCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="space-y-0.5">
        <p>
          <span className="text-slate-500">Reviewed by </span>
          <span className="font-bold text-slate-900">{info.name}</span>
        </p>
        <p className="text-[12px] text-slate-500">
          {info.jurisdiction && <>Jurisdiction: {info.jurisdiction}</>}
          {info.jurisdiction && info.barLicense && <> · </>}
          {info.barLicense && <>Bar/license: {info.barLicense}</>}
          {(info.jurisdiction || info.barLicense) && <> · </>}
          Review date: {info.reviewDate}
        </p>
      </div>
    </div>
  );
}
