'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PUBLIC_NAV, ACCOUNT_NAV, STAFF_NAV } from '@/lib/nav';
import { SITE } from '@/lib/site';
import { useIdentity } from '@/lib/auth/identity-context';
import { session } from '@/lib/auth/session';
import { me } from '@/lib/api';
import { cn } from '@/components/ui/cn';

/**
 * The application shell's primary navigation.
 *
 * The mobile menu is a disclosure that pushes the page down rather than an overlay that
 * covers it, so the browser's own controls and the rest of the page stay reachable at all
 * times. Someone may need to get off this site quickly.
 */
export function Navigation({ initialUnread = 0 }: { initialUnread?: number }) {
  const pathname = usePathname();
  const { identity, loading, can } = useIdentity();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);

  // Close the menu on navigation, or it stays open over the page the reader just chose.
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!identity) { setUnread(0); return; }
    let cancelled = false;
    void me.unreadCount().then((r) => { if (!cancelled && r.ok) setUnread(r.data.unread); });
    return () => { cancelled = true; };
  }, [identity, pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const staffLinks = STAFF_NAV.filter((i) => !i.permission || can(i.permission));

  const linkClass = (href: string, block = false) => cn(
    'focus-ring rounded-md text-sm transition-colors',
    block ? 'block px-3 py-3 text-ui' : 'px-3 py-2',
    isActive(href) ? 'font-medium text-accent-strong' : 'text-muted hover:text-foreground',
  );

  async function signOut() {
    await session.logout();
    window.location.href = '/';
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ground/95 backdrop-blur supports-[backdrop-filter]:bg-ground/80">
      <a href="#main" className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">
        Skip to content
      </a>

      <nav className="container-site flex h-16 items-center gap-4" aria-label="Primary">
        <Link href="/" // -my-2/py-2 grows the hit area to the full header row without moving the text.
          className="focus-ring -my-2 shrink-0 rounded-sm py-2 font-display text-lg font-semibold tracking-tight">
          {SITE.name}
        </Link>

        <ul className="ml-2 hidden items-center gap-0.5 xl:flex">
          {PUBLIC_NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={linkClass(item.href)}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden items-center gap-1 xl:flex">
          {/* Nothing account-shaped renders until the session resolves, so the header does
              not flicker from signed-out to signed-in on every page load. */}
          {loading ? (
            <span className="h-9 w-40 rounded-md bg-surface-2" aria-hidden="true" />
          ) : identity ? (
            <>
              {ACCOUNT_NAV.map((item) => (
                <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={linkClass(item.href)}>
                  {item.label === 'Notifications' && unread > 0 ? (
                    <span className="flex items-center gap-1.5">
                      {item.label}
                      <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-on-accent">
                        {unread > 99 ? '99+' : unread}
                        <span className="sr-only"> unread</span>
                      </span>
                    </span>
                  ) : item.label}
                </Link>
              ))}
              {staffLinks.map((item) => (
                <Link key={item.href} href={item.href} className={cn(linkClass(item.href), 'text-accent-strong')}>
                  {item.label}
                </Link>
              ))}
              <button type="button" onClick={signOut} className="focus-ring ml-1 rounded-md px-3 py-2 text-sm text-muted hover:text-foreground">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="focus-ring rounded-md px-3 py-2 text-sm text-muted hover:text-foreground">Sign in</Link>
              <Link href="/register" className="focus-ring rounded-md border border-line-strong bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-2">
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="focus-ring -mr-2 ml-auto flex h-11 w-11 items-center justify-center rounded-md xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
          </svg>
        </button>
      </nav>

      <div id="mobile-nav" hidden={!open} className="border-t border-line xl:hidden">
        <div className="container-site max-h-[calc(100vh-4rem)] overflow-y-auto py-2">
          <ul>
            {PUBLIC_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={linkClass(item.href, true)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="my-2 border-t border-line" />

          {identity ? (
            <ul>
              {/* Cases, Community, My cases and Notifications live in the bottom bar on this
                  breakpoint, so the menu carries only what does not fit there. */}
              {[...ACCOUNT_NAV.filter((i) => !['/my-cases', '/notifications'].includes(i.href)), ...staffLinks].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={linkClass(item.href, true)}>
                    {item.label}
                    {item.label === 'Notifications' && unread > 0 && (
                      <span className="ml-2 rounded-full bg-accent px-1.5 text-xs font-semibold text-on-accent">
                        {unread > 99 ? '99+' : unread}<span className="sr-only"> unread</span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
              <li>
                <button type="button" onClick={signOut} className="focus-ring block w-full rounded-md px-3 py-3 text-left text-ui text-muted">
                  Sign out
                </button>
              </li>
            </ul>
          ) : (
            <ul>
              <li><Link href="/login" className={linkClass('/login', true)}>Sign in</Link></li>
              <li><Link href="/register" className={linkClass('/register', true)}>Create account</Link></li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
