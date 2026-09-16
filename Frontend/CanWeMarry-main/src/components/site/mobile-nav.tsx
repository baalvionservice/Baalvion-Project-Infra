'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useIdentity } from '@/lib/auth/identity-context';
import { cn } from '@/components/ui/cn';

/**
 * The bottom bar on small screens.
 *
 * Four destinations, never more. A bottom bar earns its place by being predictable, and the
 * moment it holds six things it stops being faster than a menu. Everything else — settings,
 * invitations, the staff areas — stays in the header menu, which is one tap away.
 *
 * It is hidden while unauthenticated: a visitor's most likely next action is to read or to
 * sign up, and a persistent app chrome around a page they are still evaluating is noise.
 */
const ITEMS = [
  {
    href: '/cases', label: 'Cases',
    icon: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" /></>,
  },
  {
    href: '/community', label: 'Community',
    icon: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.5" /><path d="M18 20a5.5 5.5 0 0 0-3-4.9" /></>,
  },
  {
    href: '/my-cases', label: 'Mine',
    icon: <><path d="M5 4h14v16l-7-4-7 4Z" /></>,
  },
  {
    href: '/notifications', label: 'Alerts',
    icon: <><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  },
];

export function MobileNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  const { identity } = useIdentity();

  if (!identity) return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Main"
      // env(safe-area-inset-bottom) keeps the bar clear of the home indicator on iOS,
      // where a bar flush to the edge is partly untappable.
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ground/95 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  // 56px tall: a comfortable target without eating the viewport.
                  'focus-ring relative flex h-14 flex-col items-center justify-center gap-1 text-xs transition-colors',
                  active ? 'font-medium text-accent-strong' : 'text-muted',
                )}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {item.icon}
                </svg>
                {item.label}
                {item.href === '/notifications' && unread > 0 && (
                  <span className="absolute right-[22%] top-2 min-w-[1.1rem] rounded-full bg-accent px-1 text-[0.625rem] font-semibold leading-4 text-on-accent">
                    {unread > 9 ? '9+' : unread}
                    <span className="sr-only"> unread</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
