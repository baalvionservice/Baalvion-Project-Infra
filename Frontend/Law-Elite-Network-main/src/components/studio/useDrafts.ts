import { useCallback, useEffect, useRef, useState } from 'react';

export interface Draft {
  id: string; title: string; excerpt: string; body: string; updatedAt: number;
  categoryId?: string; author?: string;
  /** Set once the draft has been saved to the CMS; later saves update that article instead of creating another. */
  cmsId?: string; cmsSlug?: string; cmsState?: 'draft' | 'pending_review';
  /** Fingerprint of what was last saved, to show "unsaved changes". */
  savedSig?: string;
}

const KEY = 'len-studio-drafts-v1';
const newDraft = (): Draft => ({ id: `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, title: '', excerpt: '', body: '', updatedAt: Date.now() });

const read = (): Draft[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

/**
 * Drafts live in this browser only (a per-editor convenience): the finished
 * article is copied into the CMS, which is the record. Storage can be
 * unavailable, so every access is guarded and the tool works without it.
 */
export function useDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const ready = useRef(false);

  useEffect(() => {
    const stored = read();
    const list = stored.length ? stored : [newDraft()];
    setDrafts(list);
    setActiveId(list[0].id);
    ready.current = true;
  }, []);

  const latest = useRef<Draft[]>([]);
  const write = useCallback(() => {
    try { localStorage.setItem(KEY, JSON.stringify(latest.current)); } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    latest.current = drafts;
    const t = setTimeout(write, 400);
    return () => clearTimeout(t);
  }, [drafts, write]);

  // A reload or tab close inside the 400 ms window must not lose the last change (e.g. the "sent for review" state).
  useEffect(() => {
    const flush = () => { if (ready.current) write(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', flush); };
  }, [write]);

  const active = drafts.find((d) => d.id === activeId) ?? drafts[0];

  const update = useCallback((patch: Partial<Draft>) => {
    setDrafts((list) => list.map((d) => (d.id === activeId ? { ...d, ...patch, updatedAt: Date.now() } : d)));
  }, [activeId]);

  const create = useCallback((seed?: Partial<Draft>) => {
    const d = { ...newDraft(), ...seed };
    setDrafts((list) => [d, ...list]);
    setActiveId(d.id);
  }, []);

  const remove = useCallback((id: string) => {
    setDrafts((list) => {
      const next = list.filter((d) => d.id !== id);
      const safe = next.length ? next : [newDraft()];
      if (id === activeId) setActiveId(safe[0].id);
      return safe;
    });
  }, [activeId]);

  return { drafts, active, setActiveId, update, create, remove };
}
