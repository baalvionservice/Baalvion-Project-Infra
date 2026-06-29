import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

interface PageShellProps {
  /** Engraved folio, e.g. "§ 01". */
  folio: string;
  /** Mono label shown above the title. */
  label: string;
  /** Small eyebrow above the heading. */
  eyebrow?: string;
  title: string;
  lede?: string;
  children: ReactNode;
}

/**
 * Standard frame for every standalone page: the running header, a ledger-style
 * page header (folio + eyebrow + running head + lede), the page body, and the
 * colophon footer. Top padding clears the fixed masthead.
 */
export function PageShell({ folio, label, eyebrow, title, lede, children }: PageShellProps) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <header className="relative border-b hairline-strong bg-ink-deep">
          <div className="site-container pb-12 pt-28 md:pb-16 md:pt-36">
            <p className="mono-label mb-4 text-accent">
              {folio} · {label}
            </p>
            {eyebrow && <p className="mono-caption mb-3">{eyebrow}</p>}
            <h1 className="running-head max-w-4xl">{title}</h1>
            {lede && <p className="body-lg mt-6 max-w-3xl">{lede}</p>}
          </div>
        </header>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
