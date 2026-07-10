import Link from 'next/link';
import { Wordmark } from '@/components/wordmark';
import { SiteSearchTrigger } from '@/components/search/site-search-trigger';
import { ROUTES } from '@/lib/content';

const QUICK_LINKS = [
  { label: 'About Baalvion', href: ROUTES.about },
  { label: 'Platform & Services', href: ROUTES.services },
  { label: 'Trust Center', href: ROUTES.trust },
  { label: 'Contact', href: ROUTES.contact },
];

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <Wordmark className="text-foreground" />
      <div className="space-y-3">
        <p className="mono-label text-accent">404</p>
        <h1 className="running-head">This page does not exist.</h1>
        <p className="body">The corporate index lives on the homepage — or search for it directly.</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/" className="btn-primary">
          Return to baalvion.com
          <span aria-hidden="true">→</span>
        </Link>
        <SiteSearchTrigger />
      </div>

      <nav aria-label="Quick links" className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="mono-caption transition-colors duration-200 hover:text-accent"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
