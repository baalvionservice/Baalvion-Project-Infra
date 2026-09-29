import type { ReactNode } from 'react';
import Link from 'next/link';
import { Wordmark } from '@/components/wordmark';
import { ROUTES } from '@/lib/content';

const FOOTER_LINKS = [
  { label: 'Privacy', href: ROUTES.privacy },
  { label: 'Terms', href: ROUTES.terms },
  { label: 'Email policy', href: ROUTES.email },
  { label: 'Support', href: ROUTES.contact },
] as const;

/**
 * Minimal frame for authentication pages: a wordmark bar back to the homepage
 * and a slim legal strip, so even the sign-in surface carries the company's
 * trust and policy links.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="border-b hairline">
        <div className="site-container flex h-16 items-center">
          <Link href={ROUTES.home} aria-label="Baalvion — home" className="text-foreground">
            <Wordmark />
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="grid flex-1 place-items-center px-4 py-16 outline-none">
        {children}
      </main>

      <footer className="border-t hairline">
        <div className="site-container flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono-caption">© {new Date().getFullYear()} Baalvion</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="mono-caption hover:text-accent">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
