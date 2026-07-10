import Link from 'next/link';
import { SITE } from '@/lib/content';

export interface Crumb {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  /** Trail between Home and the current page — Home and the current page are
   *  added automatically, so pass only the intermediate parents. */
  items: Crumb[];
  current: string;
}

/** Ledger-voice breadcrumb trail, paired with matching BreadcrumbList JSON-LD
 *  so the same hierarchy is legible to a reader and to a crawler. */
export function Breadcrumbs({ items, current }: BreadcrumbsProps) {
  const trail: Crumb[] = [{ label: 'Home', href: '/' }, ...items];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [...trail, { label: current, href: '' }].map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      ...(crumb.href ? { item: `${SITE.url}${crumb.href === '/' ? '' : crumb.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ol className="mono-caption flex flex-wrap items-center gap-x-2 gap-y-1">
        {trail.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-x-2">
            <Link href={crumb.href} className="transition-colors duration-200 hover:text-accent">
              {crumb.label}
            </Link>
            <span aria-hidden="true" className="text-muted-2/50">
              /
            </span>
          </li>
        ))}
        <li aria-current="page" className="text-muted-2">
          {current}
        </li>
      </ol>
    </nav>
  );
}
