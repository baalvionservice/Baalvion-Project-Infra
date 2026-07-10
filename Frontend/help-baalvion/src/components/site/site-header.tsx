import Link from 'next/link';
import { DOCS_SECTIONS } from '@/lib/nav';
import { EXTERNAL } from '@/lib/site';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ground/85 backdrop-blur">
      <div className="container-site flex h-16 items-center gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-base font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-on-accent">B</span>
          Baalvion Help
        </Link>

        <nav aria-label="Documentation sections" className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
          {DOCS_SECTIONS.map((section) => (
            <Link
              key={section.slug}
              href={section.groups[0]?.items[0]?.href ?? '/'}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted transition hover:text-foreground"
            >
              {section.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link href={EXTERNAL.login} className="btn-primary">
            Open Trade Platform
          </Link>
        </div>
      </div>
    </header>
  );
}
