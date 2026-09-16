import Link from 'next/link';
import { SITE } from '@/lib/site';

const GROUPS = [
  {
    heading: 'Platform',
    links: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/guides', label: 'Guides' },
      { href: '/cases', label: 'Cases' },
      { href: '/community', label: 'Community' },
      { href: '/resources', label: 'Resources' },
    ],
  },
  {
    heading: 'Trust and safety',
    links: [
      { href: '/safety', label: 'Trust and safety' },
      { href: '/guides/if-it-stops-being-safe', label: 'If it stops being safe' },
      { href: '/about', label: 'About us' },
      { href: '/about#boundaries', label: 'What this is not' },
      { href: '/resources?category=SAFETY', label: 'Safety resources' },
      { href: '/me/reports', label: 'Your reports' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container-site grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-lg font-semibold">{SITE.name}</p>
          <p className="mt-2 max-w-sm text-sm text-muted">{SITE.tagline}.</p>
          {/* Stated in the footer of every page, not buried in a policy document. */}
          <p className="mt-4 max-w-sm text-sm text-muted">
            {SITE.name} is not an emergency service. If you or someone else is in immediate danger,
            contact your local emergency number.
          </p>
        </div>

        {GROUPS.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <h2 className="text-sm font-semibold text-foreground">{group.heading}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="focus-ring rounded-sm text-sm text-muted hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-site flex flex-col gap-2 py-5 text-xs text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {SITE.name}</p>
          <p>Nothing on this site is legal advice.</p>
        </div>
      </div>
    </footer>
  );
}
