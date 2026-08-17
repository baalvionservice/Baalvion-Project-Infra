import React from 'react';
import Link from 'next/link';
import { BadgeCheck, Info } from 'lucide-react';

export interface ReviewedByInfo {
  name: string;
  jurisdiction?: string;
  barLicense?: string;
  reviewDate: string;
}

/**
 * Attorney-review credit line. Never claims review happened when it didn't --
 * see the `reviewedBy` doc comment on LawArticle and /editorial-process: this
 * network only credits a named attorney where review actually took place.
 * When it didn't, that limitation is stated plainly rather than left blank --
 * per /editorial-process ("Legal review status") a reader should never have
 * to guess whether a guide was attorney-reviewed.
 */
export function ReviewedBy({ info }: { info?: ReviewedByInfo }) {
  if (!info) {
    return (
      <div className="flex items-start gap-2.5 text-[13px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          Legal review: Not independently reviewed by a licensed attorney. This guide is general legal
          information researched and edited under our{' '}
          <Link href="/editorial-process" className="text-blue-600 hover:underline">Editorial Process</Link>.
        </p>
      </div>
    );
  }

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
