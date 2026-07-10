import Link from 'next/link';
import { LogoMark } from '@/components/logo-mark';
import { TRADE_PORTAL } from '@/lib/site';

type FooterColumn = {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
};

const COLUMNS: FooterColumn[] = [
  {
    heading: 'Company',
    links: [
      { label: 'About Baalvion', href: '/about' },
      { label: 'Platform', href: '/platform' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { label: 'Buyer Solutions', href: '/solutions/buyers' },
      { label: 'Seller Solutions', href: '/solutions/sellers' },
      { label: 'Trade Agent Solutions', href: '/solutions/trade-agents' },
      { label: 'Sign In to Trade Portal', href: TRADE_PORTAL.login, external: true },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Getting Started', href: '/resources#getting-started' },
      { label: 'Guides', href: '/resources#guides' },
      { label: 'FAQs', href: '/resources#faqs' },
      { label: 'Product Updates', href: '/resources#updates' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Contact Sales', href: '/contact' },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: 'LinkedIn', href: '#' },
  { label: 'X (Twitter)', href: '#' },
  { label: 'YouTube', href: '#' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-site py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <LogoMark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              The trade operations platform where buyers, sellers, and trade agents run global
              procurement from one shared source of truth.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-xs font-semibold text-muted transition hover:border-line-strong hover:text-foreground"
                  aria-label={social.label}
                >
                  {social.label.slice(0, 1)}
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="eyebrow">{column.heading}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a href={link.href} className="focus-ring text-sm text-muted transition hover:text-foreground">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="focus-ring text-sm text-muted transition hover:text-foreground">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 text-xs text-muted-2 sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} Baalvion. All rights reserved.</p>
          <p>Built for global trade — sourcing, procurement, and fulfillment, unified.</p>
        </div>
      </div>
    </footer>
  );
}
