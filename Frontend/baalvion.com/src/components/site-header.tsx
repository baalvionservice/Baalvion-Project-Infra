'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EXTERNAL, NAV, ROUTES } from '@/lib/content';
import { Wordmark } from './wordmark';
import { SiteSearchTrigger } from './search/site-search-trigger';

function slug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/** The charter's running header — persistent masthead, mega-menu disclosures,
 *  search, and a live status chip, with a collapsible drawer on small screens. */
export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape' || !openMenu) return;
      const label = openMenu;
      setOpenMenu(null);
      triggerRefs.current.get(label)?.focus();
    }
    function onPointerDown(e: PointerEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [openMenu]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b hairline bg-ink/80 backdrop-blur-md">
      <div className="site-container flex h-16 items-center justify-between">
        <Link
          href={ROUTES.home}
          aria-label="Baalvion — home"
          className="text-foreground"
          onClick={() => setOpenMenu(null)}
        >
          <Wordmark />
        </Link>

        <nav ref={navRef} aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const panelId = `nav-panel-${slug(item.label)}`;
            const isOpen = openMenu === item.label;
            return (
              <div key={item.label} className="relative">
                {item.children ? (
                  <button
                    ref={(el) => {
                      if (el) triggerRefs.current.set(item.label, el);
                    }}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenMenu((v) => (v === item.label ? null : item.label))}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={`text-[0.6rem] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      ▾
                    </span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="block px-3 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                )}

                {item.children && isOpen && (
                  <div id={panelId} className="absolute left-1/2 top-full w-[26rem] -translate-x-1/2 pt-3">
                    <div className="border hairline-strong bg-ink shadow-2xl">
                      <ul className="divide-y divide-line">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="group block px-5 py-3.5 transition-colors duration-200 hover:bg-surface-2 focus-visible:bg-surface-2"
                              onClick={() => setOpenMenu(null)}
                            >
                              <span className="block text-sm font-medium text-foreground">
                                {child.label}
                              </span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                                {child.description}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {item.more && (
                        <Link
                          href={item.more.href}
                          className="mono-caption block border-t hairline px-5 py-3 text-accent transition-colors duration-200 hover:text-accent-ink"
                          onClick={() => setOpenMenu(null)}
                        >
                          {item.more.label} <span aria-hidden="true">→</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <SiteSearchTrigger />
          <span
            className="mono-label hidden items-center gap-2 md:inline-flex"
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
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              {mobileOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          className="max-h-[calc(100svh-4rem)] overflow-y-auto border-t hairline bg-ink/95 backdrop-blur-md lg:hidden"
        >
          <ul className="site-container flex flex-col py-2">
            {NAV.map((item) => {
              const expanded = mobileExpanded === item.label;
              return (
                <li key={item.label} className="border-b hairline last:border-b-0">
                  {item.children ? (
                    <>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between py-3 text-sm font-medium text-foreground"
                        aria-expanded={expanded}
                        onClick={() => setMobileExpanded((v) => (v === item.label ? null : item.label))}
                      >
                        {item.label}
                        <span
                          aria-hidden="true"
                          className={`text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                        >
                          ▾
                        </span>
                      </button>
                      {expanded && (
                        <ul className="space-y-1 pb-3 pl-3">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className="block py-2 text-sm text-muted transition-colors hover:text-foreground"
                                onClick={() => setMobileOpen(false)}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                          {item.more && (
                            <li>
                              <Link
                                href={item.more.href}
                                className="mono-caption block py-2 text-accent"
                                onClick={() => setMobileOpen(false)}
                              >
                                {item.more.label} <span aria-hidden="true">→</span>
                              </Link>
                            </li>
                          )}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="block py-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
            <li className="mt-3 flex gap-3 pb-3 pt-1">
              <Link
                href={ROUTES.signin}
                className="flex-1 bg-accent px-4 py-2 text-center text-sm font-medium text-ink-deep"
                onClick={() => setMobileOpen(false)}
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
