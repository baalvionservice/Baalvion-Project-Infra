"use client";

import React, { useMemo, useState } from 'react';
import { CaseCard } from './CaseCard';
import { CASE_STATUSES } from '@/types/legal';
import type { LegalCase, CaseStatus } from '@/types/legal';

const STATUS_LABEL: Record<CaseStatus, string> = {
  ongoing: 'Ongoing', concluded: 'Concluded', settled: 'Settled', dismissed: 'Dismissed', appealed: 'Appealed',
};

/** Client-side status filter over the full case list — same pattern as the other directories. */
export function CasesDirectory({ cases, courtNames = {} }: { cases: LegalCase[]; courtNames?: Record<string, string> }) {
  const [active, setActive] = useState<CaseStatus | 'all'>('all');

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    cases.forEach((c) => map.set(c.status, (map.get(c.status) || 0) + 1));
    return map;
  }, [cases]);

  const visible = active === 'all' ? cases : cases.filter((c) => c.status === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-10" role="tablist" aria-label="Filter by status">
        <button
          onClick={() => setActive('all')}
          aria-pressed={active === 'all'}
          className={`px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-tight transition-colors ${
            active === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({cases.length})
        </button>
        {CASE_STATUSES.map((status) => {
          const count = counts.get(status) || 0;
          if (!count) return null;
          return (
            <button
              key={status}
              onClick={() => setActive(status)}
              aria-pressed={active === status}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-tight transition-colors ${
                active === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {STATUS_LABEL[status]} ({count})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-slate-500 text-sm">No cases in this status yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((c) => <CaseCard key={c.slug} legalCase={c} courtName={c.courtSlug ? courtNames[c.courtSlug] : undefined} />)}
        </div>
      )}
    </div>
  );
}
