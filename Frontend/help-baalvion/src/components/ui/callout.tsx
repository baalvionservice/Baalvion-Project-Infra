import type { ReactNode } from 'react';

type CalloutType = 'note' | 'tip' | 'warning' | 'danger';

const STYLES: Record<CalloutType, { border: string; bg: string; icon: string; label: string }> = {
  note: { border: 'border-accent/30', bg: 'bg-accent/[0.06]', icon: 'text-accent-strong', label: 'Note' },
  tip: { border: 'border-ok/30', bg: 'bg-ok/[0.06]', icon: 'text-ok', label: 'Tip' },
  warning: { border: 'border-warn/40', bg: 'bg-warn/[0.08]', icon: 'text-warn', label: 'Common mistake' },
  danger: { border: 'border-danger/40', bg: 'bg-danger/[0.08]', icon: 'text-danger', label: 'Important' },
};

export function Callout({ type = 'note', title, children }: { type?: CalloutType; title?: string; children: ReactNode }) {
  const s = STYLES[type];
  return (
    <div className={`not-prose my-5 rounded-lg border ${s.border} ${s.bg} p-4`}>
      <div className={`mb-1 flex items-center gap-2 text-sm font-semibold ${s.icon}`}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4 shrink-0">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 8v5" />
          <path strokeLinecap="round" d="M12 16h.01" />
        </svg>
        {title ?? s.label}
      </div>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}
