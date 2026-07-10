import type { ReactNode } from 'react';

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="not-prose my-6 flex flex-col gap-0 [counter-reset:step]">{children}</ol>;
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="relative flex gap-4 pb-8 [counter-increment:step] last:pb-0">
      <div className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-line last-of-type:hidden" />
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-sm font-semibold text-foreground before:content-[counter(step)]" />
      <div className="flex-1 pt-0.5">
        <p className="font-semibold text-foreground">{title}</p>
        <div className="mt-1 text-sm leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  );
}
