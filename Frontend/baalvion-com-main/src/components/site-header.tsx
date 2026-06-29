'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EXTERNAL, NAV, ROUTES } from '@/lib/content';
import { Wordmark } from './wordmark';

/** The charter's running header — persistent masthead with a live status chip
 *  and a collapsible menu on small screens. */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b hairline bg-ink/80 backdrop-blur-md">
      <div className="site-container flex h-16 items-center justify-between">
        <Link href={ROUTES.home} aria-label="Baalvion — home" className="text-foreground">
          <Wordmark />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-9 lg:flex">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </Link>
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
            className="hidden border hairline-strong px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:border-accent hover:text-accent active:border-accent-ink active:text-accent-ink lg:inline-flex"
          >
            Investor Relations
          </a>
          <Link
            href={ROUTES.signin}
            className="hidden bg-accent px-4 py-2 text-sm font-medium text-ink-deep transition-colors duration-200 hover:bg-accent-ink sm:inline-flex"
          >
            Sign in
          </Link>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center border hairline-strong text-foreground lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              {open ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          className="border-t hairline bg-ink/95 backdrop-blur-md lg:hidden"
        >
          <ul className="site-container flex flex-col py-3">
            {NAV.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex gap-3 border-t hairline pt-4">
              <Link
                href={ROUTES.signin}
                className="flex-1 bg-accent px-4 py-2 text-center text-sm font-medium text-ink-deep"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
              <a
                href={EXTERNAL.ir}
                className="flex-1 border hairline-strong px-4 py-2 text-center text-sm font-medium text-foreground"
              >
                Investors
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
