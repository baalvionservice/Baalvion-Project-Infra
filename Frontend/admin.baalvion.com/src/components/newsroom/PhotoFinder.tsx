'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { editorialPipelineApi } from '@/lib/api/editorial';
import { editorialKeys } from '@/lib/queries/editorial.queries';
import type { PhotoCandidate } from '@/lib/types/editorial.types';

const field = 'w-full rounded border border-white/20 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-white/40';

/**
 * Attach a free-licensed photo to a draft. Only files whose Commons licence allows commercial use with credit are
 * shown. The editor says what the photo shows and confirms it does: that confirmation is what marks the art as
 * really depicting a named subject, so it is never assumed.
 */
export function PhotoFinder({ websiteId, draftId, defaultQuery }: { websiteId: string; draftId: string; defaultQuery: string }) {
  const qc = useQueryClient();
  const [query, setQuery] = useState(defaultQuery);
  const [searched, setSearched] = useState('');
  const [picked, setPicked] = useState<PhotoCandidate | null>(null);
  const [subject, setSubject] = useState('');
  const [alt, setAlt] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const art = useQuery({ queryKey: [...editorialKeys.all, 'art', draftId], queryFn: () => editorialPipelineApi.listDraftArt(websiteId, draftId).then((r) => r.data.data) });
  const primary = art.data?.find((a) => a.isPrimary && ['ready', 'approved'].includes(a.status));

  const search = useQuery({
    queryKey: [...editorialKeys.all, 'photos', searched],
    queryFn: () => editorialPipelineApi.searchPhotos(websiteId, searched).then((r) => r.data.data),
    enabled: searched.length >= 2, staleTime: 5 * 60_000, retry: false,
  });

  const attach = useMutation({
    mutationFn: () => editorialPipelineApi.attachPhoto(websiteId, draftId, { title: picked!.title, subject: subject.trim(), altText: alt.trim() || undefined, confirmedDepictsSubject: confirmed }),
    onSuccess: async () => {
      toast.success('Photo attached. Re-checking the gates.');
      setPicked(null); setConfirmed(false); setAlt('');
      await editorialPipelineApi.gateDraft(websiteId, draftId).catch(() => undefined);
      qc.invalidateQueries({ queryKey: editorialKeys.all });
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Could not attach that photo'),
  });

  return (
    <details className="my-4 rounded border border-white/15">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm">
        <span className="font-semibold">Photo</span>
        <span className="ml-2 text-white/60">
          {primary ? `${primary.kind === 'photo' ? primary.licenseName : 'illustration'} · ${primary.attribution ?? ''}` : 'none yet'}
        </span>
      </summary>
      <div className="space-y-3 border-t border-white/15 p-3">
        {primary?.url && <img src={primary.url} alt={primary.altText ?? ''} className="max-h-40 rounded" />}
        <p className="text-xs text-white/60">Free-licensed photos from Wikimedia Commons (CC0, public domain, CC BY, CC BY-SA). The credit is published with the photo.</p>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setSearched(query.trim()); setPicked(null); }}>
          <input className={field} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Person, film, place…" aria-label="Search photos" />
          <button type="submit" className="bv-nr-btn shrink-0">Search</button>
        </form>

        {search.isFetching && <p className="text-sm text-white/60">Searching…</p>}
        {search.isError && <p className="text-sm text-red-400">Could not reach Wikimedia Commons. Try again shortly.</p>}
        {search.data && search.data.length === 0 && <p className="text-sm text-white/60">No free-licensed photos found. Try another name, or use the generated illustration.</p>}

        {search.data && search.data.length > 0 && (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {search.data.map((c) => (
              <li key={c.title}>
                <button type="button" onClick={() => { setPicked(c); setSubject(searched); setConfirmed(false); }}
                  className={`block w-full rounded border p-1 text-left ${picked?.title === c.title ? 'border-white' : 'border-white/15 hover:border-white/50'}`}>
                  <img src={c.thumbUrl} alt={c.description || c.title} loading="lazy" className="h-24 w-full rounded object-cover" />
                  <span className="mt-1 block text-[11px] leading-tight text-white/70">{c.license.name}{c.personalityRights ? ' · personality rights' : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {picked && (
          <div className="space-y-2 rounded border border-white/15 p-3 text-sm">
            <p><span className="text-white/60">Credit that will be shown:</span> {picked.credit}</p>
            {picked.personalityRights && <p className="text-amber-400">Commons flags personality or publicity rights on this image. Check it is appropriate for news use.</p>}
            <a className="text-blue-300 underline" href={picked.pageUrl} target="_blank" rel="noopener noreferrer">Open on Wikimedia Commons</a>
            <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What does the photo show? (required)" aria-label="What the photo shows" />
            <input className={field} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Alt text for screen readers (optional)" aria-label="Alt text" />
            <label className="flex items-start gap-2 text-white/80">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
              I have checked that this photo really shows the subject named above.
            </label>
            <button type="button" className="bv-nr-btn bv-nr-btn--go" disabled={attach.isPending || !subject.trim()} onClick={() => attach.mutate()}>
              {attach.isPending ? 'Attaching…' : 'Use this photo'}
            </button>
          </div>
        )}
      </div>
    </details>
  );
}
