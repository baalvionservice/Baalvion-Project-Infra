import type { ReactNode } from 'react';

export interface FaqItem {
  question: string;
  answer: ReactNode;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="not-prose my-6 divide-y divide-line rounded-xl border border-line bg-surface">
      {items.map((item) => (
        <details key={item.question} className="group px-5 py-4 open:pb-4">
          <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-medium text-foreground marker:content-none">
            {item.question}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <div className="mt-2 text-sm leading-relaxed text-muted">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
