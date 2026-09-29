'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { editorialPipelineApi } from '@/lib/api/editorial';
import { editorialKeys } from '@/lib/queries/editorial.queries';

/**
 * The draft read sentence by sentence next to what backs it, on the same rule the citation gate uses.
 * Green = a citation covers it (open the source to confirm). Red = a figure or quotation with no citation.
 * Amber = a plain statement with no source: the gate cannot see these, so this is where invented background hides.
 * Ticking "checked" is only the reviewer's own progress marker; it is not saved and never approves anything.
 */
export function ClaimCheck({ websiteId, draftId }: { websiteId: string; draftId: string }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const report = useQuery({
    queryKey: [...editorialKeys.all, 'claims', draftId],
    queryFn: () => editorialPipelineApi.claimCheck(websiteId, draftId).then((r) => r.data.data),
    staleTime: 30_000,
  });
  const data = report.data;
  const checkedCount = Object.values(done).filter(Boolean).length;

  return (
    <details className="my-4 rounded border border-white/15">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm">
        <span className="font-semibold">Check claims</span>
        <span className="ml-2 text-white/60">
          {!data ? 'loading…' : data.uncited + data.unsourced > 0
            ? [data.uncited > 0 && `${data.uncited} figure${data.uncited === 1 ? '' : 's'} or quote${data.uncited === 1 ? '' : 's'} with no source`, data.unsourced > 0 && `${data.unsourced} statement${data.unsourced === 1 ? '' : 's'} with no source`].filter(Boolean).join(' · ')
            : 'every claim has a source'}
        </span>
      </summary>
      <div className="space-y-1 border-t border-white/15 p-3 text-sm">
        {report.isError && <p className="text-red-400">Could not load the claim check.</p>}
        {data && (
          <>
            <p className="pb-1 text-xs text-white/60">
              Open each source and confirm the sentence says what it says. Sentences without a figure are shown too, since they can still be wrong. {checkedCount}/{data.sentences.length} checked by you.
            </p>
            <ol className="space-y-1.5">
              {data.sentences.map((s, i) => (
                <li key={i} className={`flex gap-2 rounded border-l-2 px-2 py-1.5 ${s.source ? 'border-emerald-500/70' : s.checkable ? 'border-red-500/80 bg-red-500/10' : s.disclaimer ? 'border-white/15' : 'border-amber-500/70 bg-amber-500/10'}`}>
                  <input type="checkbox" className="mt-1 shrink-0" checked={!!done[i]} onChange={(e) => setDone((d) => ({ ...d, [i]: e.target.checked }))} aria-label={`Mark sentence ${i + 1} as checked`} />
                  <div className="min-w-0">
                    <p className="leading-snug text-white/90">{s.text}</p>
                    {s.source ? (
                      <p className="text-xs text-emerald-300">
                        Source:{' '}
                        {s.source.url ? <a href={s.source.url} target="_blank" rel="noopener noreferrer" className="underline">{s.source.name ?? s.source.url}</a> : s.source.name}
                      </p>
                    ) : s.checkable ? (
                      <p className="text-xs text-red-300">No source for this figure or quote. Verify it, add the source, or remove it.</p>
                    ) : !s.disclaimer ? (
                      <p className="text-xs text-amber-300">No source attached. This reads as background the sources may not state. Confirm it or cut it.</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </details>
  );
}
