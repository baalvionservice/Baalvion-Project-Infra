import type { ReactNode } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted border-line',
  accent: 'bg-accent-soft text-accent-strong border-accent/25',
  ok: 'bg-ok/10 text-ok border-ok/25',
  warn: 'bg-warn/10 text-warn border-warn/25',
  danger: 'bg-danger/10 text-danger border-danger/25',
};

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {children}
    </span>
  );
}

const VISIBILITY_TONE = { PUBLIC: 'accent', COMMUNITY: 'neutral', PRIVATE: 'ok' } as const;
const VISIBILITY_LABEL = { PUBLIC: 'Public', COMMUNITY: 'Community only', PRIVATE: 'Private' } as const;

/**
 * The visibility badge is not decoration — it is how a person checks, at a glance, who can
 * see what they wrote. It appears on every case surface for that reason.
 */
export function VisibilityBadge({ visibility }: { visibility: 'PUBLIC' | 'COMMUNITY' | 'PRIVATE' }) {
  return <Badge tone={VISIBILITY_TONE[visibility]}>{VISIBILITY_LABEL[visibility]}</Badge>;
}
