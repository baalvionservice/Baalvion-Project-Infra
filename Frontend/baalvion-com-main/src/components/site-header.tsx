import { EXTERNAL, NAV } from '@/lib/content';
import { Wordmark } from './wordmark';

/** The charter's running header — persistent masthead with a live status chip. */
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b hairline bg-ink/80 backdrop-blur-md">
      <div className="site-container flex h-16 items-center justify-between">
        <a href="#top" aria-label="Baalvion — home" className="text-foreground">
          <Wordmark />
        </a>

        <nav aria-label="Main navigation" className="hidden items-center gap-9 lg:flex">
          {NAV.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <span
            className="mono-label hidden items-center gap-2 sm:inline-flex"
            aria-label="All systems operating"
          >
            <span className="status-dot" aria-hidden="true" />
            Operating
          </span>
          <a
            href={EXTERNAL.ir}
            className="hidden border hairline-strong px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:border-accent hover:text-accent active:border-accent-ink active:text-accent-ink sm:inline-flex"
          >
            Investor Relations
          </a>
          <a
            href="/signin"
            className="bg-accent px-4 py-2 text-sm font-medium text-ink-deep transition-colors duration-200 hover:bg-accent-ink"
          >
            Sign in
          </a>
        </div>
      </div>
    </header>
  );
}
