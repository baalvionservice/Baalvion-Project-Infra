import Link from 'next/link';
import type { ReactNode } from 'react';

export function CardGrid({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 }) {
  const cols = columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2';
  return <div className={`not-prose my-6 grid grid-cols-1 gap-4 ${cols}`}>{children}</div>;
}

export function CardLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <Link href={href} className="doc-card group flex flex-col">
      {icon && <div className="mb-3 text-accent-strong">{icon}</div>}
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-strong opacity-0 transition group-hover:opacity-100">
        Read more
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
