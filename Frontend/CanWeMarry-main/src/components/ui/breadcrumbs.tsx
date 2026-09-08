import Link from 'next/link';

export interface Crumb {
  href?: string;
  label: string;
}

/** The last crumb is the current page and is not a link — it marks position, not a destination. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {c.href && !last ? (
                <Link href={c.href} className="focus-ring rounded-sm hover:text-foreground">{c.label}</Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={last ? 'text-foreground' : undefined}>
                  {c.label}
                </span>
              )}
              {!last && <span aria-hidden="true" className="text-muted-2">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
