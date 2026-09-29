import Link from 'next/link';
import { DOCS_SECTIONS } from '@/lib/nav';

export function Breadcrumbs({ pathname, title }: { pathname: string; title: string }) {
  const slug = pathname.split('/').filter(Boolean)[0];
  const section = DOCS_SECTIONS.find((s) => s.slug === slug);

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-muted">
      <Link href="/" className="hover:text-foreground">
        Help Center
      </Link>
      {section && (
        <>
          <span aria-hidden="true">/</span>
          <Link href={section.groups[0]?.items[0]?.href ?? '/'} className="hover:text-foreground">
            {section.label}
          </Link>
        </>
      )}
      <span aria-hidden="true">/</span>
      <span className="text-foreground">{title}</span>
    </nav>
  );
}
