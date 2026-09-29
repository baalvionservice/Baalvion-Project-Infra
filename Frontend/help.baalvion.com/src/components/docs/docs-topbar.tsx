'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCS_SECTIONS } from '@/lib/nav';
import { EXTERNAL } from '@/lib/site';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function DocsTopbar({ onOpenSearch, onToggleMobileNav }: { onOpenSearch: () => void; onToggleMobileNav: () => void }) {
  const pathname = usePathname();
  const activeSlug = pathname.split('/').filter(Boolean)[0];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ground/85 backdrop-blur">
      <div className="container-site flex h-16 items-center gap-4">
        <button
          type="button"
          onClick={onToggleMobileNav}
          aria-label="Toggle navigation menu"
          className="focus-ring -ml-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-base font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-on-accent">B</span>
          Baalvion Help
        </Link>

        <nav aria-label="Documentation sections" className="scrollbar-none hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
          {DOCS_SECTIONS.map((section) => (
            <Link
              key={section.slug}
              href={section.groups[0]?.items[0]?.href ?? '/'}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                activeSlug === section.slug ? 'bg-surface-2 text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              {section.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="focus-ring hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted transition hover:bg-surface-2 sm:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
            </svg>
            Search
            <kbd className="kbd ml-2">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search documentation"
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted sm:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
            </svg>
          </button>
          <ThemeToggle />
          <Link href={EXTERNAL.login} className="btn-primary hidden sm:inline-flex">
            Open Trade Platform
          </Link>
        </div>
      </div>
    </header>
  );
}
