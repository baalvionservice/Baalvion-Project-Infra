import React from 'react';
import Link from 'next/link';
import { Gavel, BadgeCheck } from 'lucide-react';
import { legalCaseUrl } from '@/lib/legal-case-url';
import type { LegalCase } from '@/types/legal';

const STATUS_LABEL: Record<LegalCase['status'], string> = {
  ongoing: 'Ongoing', concluded: 'Concluded', settled: 'Settled', dismissed: 'Dismissed', appealed: 'Appealed',
};

/** Directory-grid card for a LegalCase, styled to match PersonCard/EntertainmentCard. */
export function CaseCard({ legalCase, courtName }: { legalCase: LegalCase; courtName?: string }) {
  return (
    <Link href={legalCaseUrl(legalCase.slug)} className="group flex flex-col h-full border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
      <span className="kicker mb-2 inline-flex items-center gap-1.5"><Gavel className="w-3.5 h-3.5" /> Legal Case</span>
      <h3 className="font-headline text-base md:text-lg font-bold leading-snug text-slate-900 group-hover:text-news-600 transition-colors flex items-start gap-1.5">
        <span>{legalCase.caseName}</span>
        {legalCase.verification.verified && (
          <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0 mt-1" aria-label="Verified reference entry" />
        )}
      </h3>
      {courtName && <p className="mt-1 text-[13px] text-slate-500 font-medium">{courtName}</p>}
      <span className="mt-3 inline-flex w-fit items-center rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1">
        {STATUS_LABEL[legalCase.status]}
      </span>
    </Link>
  );
}
