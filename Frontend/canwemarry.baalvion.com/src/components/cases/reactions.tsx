'use client';

import { useEffect, useState } from 'react';
import { reactions as reactionsApi } from '@/lib/api';
import { useIdentity } from '@/lib/auth/identity-context';
import { useToast } from '@/components/ui';
import type { ReactionKind, ReactionSummary } from '@/lib/api/types';
import { cn } from '@/components/ui/cn';

/**
 * Supportive reactions.
 *
 * The three kinds are the only three the schema permits — there is no downvote to render,
 * which removes a whole class of pile-on behaviour rather than moderating it afterwards.
 *
 * The count updates optimistically because a reaction is trivially reversible and the
 * latency is more annoying than the rare rollback. Anything with a consequence — support,
 * consent, moderation — waits for the server instead.
 */
const KINDS: { kind: ReactionKind; label: string; hint: string }[] = [
  { kind: 'SUPPORT', label: 'Standing with you', hint: 'Mark that you are with this person' },
  { kind: 'THANKS', label: 'Thank you', hint: 'Thank the author for sharing' },
  { kind: 'HELPFUL', label: 'Helpful', hint: 'Mark this as useful to others' },
];

export function Reactions({ targetType, targetId }: { targetType: 'CASE' | 'POST' | 'COMMENT'; targetId: string }) {
  const { identity } = useIdentity();
  const toast = useToast();
  const [summary, setSummary] = useState<ReactionSummary | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void reactionsApi.summary(targetType, targetId).then((r) => {
      if (!cancelled && r.ok) setSummary(r.data);
    });
    return () => { cancelled = true; };
  }, [targetType, targetId]);

  if (!summary) return null;

  async function toggle(kind: ReactionKind) {
    if (!identity || busy) return;
    const previous = summary;
    const removing = summary!.mine === kind;

    // Optimistic: move the count now, put it back if the server disagrees.
    setSummary((s) => {
      if (!s) return s;
      const counts = { ...s.counts };
      if (s.mine) counts[s.mine] = Math.max(0, (counts[s.mine] ?? 1) - 1);
      if (!removing) counts[kind] = (counts[kind] ?? 0) + 1;
      return { counts, mine: removing ? null : kind };
    });

    setBusy(true);
    const result = removing
      ? await reactionsApi.clear(targetType, targetId)
      : await reactionsApi.set({ targetType, targetId, kind });
    setBusy(false);

    if (!result.ok) {
      setSummary(previous);
      toast.error(result.error.message);
    }
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {KINDS.map(({ kind, label, hint }) => {
        const count = summary.counts[kind] ?? 0;
        const on = summary.mine === kind;
        return (
          <li key={kind}>
            <button
              type="button"
              onClick={() => void toggle(kind)}
              disabled={!identity || busy}
              aria-pressed={on}
              title={identity ? hint : 'Sign in to react'}
              className={cn(
                'focus-ring rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-60',
                on
                  ? 'border-accent bg-accent-soft font-medium text-accent-strong'
                  : 'border-line-strong bg-surface text-muted enabled:hover:text-foreground',
              )}
            >
              {label}
              {count > 0 && <span className="ml-1.5 tabular-nums">{count}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
