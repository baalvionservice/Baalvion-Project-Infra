'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

type CodeProps = {
  label: string;
  value: string;
  /** The employee number is the rarer, more consequential one — give it the accent. */
  emphasis?: boolean;
};

function CodeChip({ label, value, emphasis }: CodeProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked (insecure origin / denied permission) — the value is still readable */
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2',
        emphasis ? 'border-primary/40 bg-primary/5' : 'bg-muted/40',
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-mono text-sm font-semibold tabular-nums">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="ml-auto shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

/**
 * The candidate's quotable IDs. The Candidate ID exists from the moment they register;
 * the Employee ID only appears once an application has been marked hired — so this
 * renders one chip or two, never a placeholder for an ID that hasn't been issued.
 */
export function IdentityCodes({
  referenceCode,
  employeeCode,
  className,
}: {
  referenceCode?: string | null;
  employeeCode?: string | null;
  className?: string;
}) {
  if (!referenceCode && !employeeCode) return null;

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {referenceCode && <CodeChip label="Candidate ID" value={referenceCode} />}
      {employeeCode && <CodeChip label="Employee ID" value={employeeCode} emphasis />}
    </div>
  );
}
