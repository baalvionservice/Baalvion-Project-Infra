import Link from 'next/link';
import { EXTERNAL } from '@/lib/site';
import { DOCS_SECTIONS } from '@/lib/nav';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-site grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Link href="/" className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-on-accent">
              B
            </span>
            Baalvion Help
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Documentation, onboarding, and API reference for the Baalvion trade platform.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-2">Documentation</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {DOCS_SECTIONS.map((section) => (
              <li key={section.slug}>
                <Link href={section.groups[0]?.items[0]?.href ?? '/'} className="text-muted hover:text-foreground">
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-2">Baalvion</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <a href={EXTERNAL.marketing} className="text-muted hover:text-foreground">
                baalvion.com
              </a>
            </li>
            <li>
              <a href={EXTERNAL.trade} className="text-muted hover:text-foreground">
                Trade Platform
              </a>
            </li>
            <li>
              <a href={EXTERNAL.insights} className="text-muted hover:text-foreground">
                Insights & Blog
              </a>
            </li>
            <li>
              <a href={EXTERNAL.investors} className="text-muted hover:text-foreground">
                Investor Relations
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-2">Support</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <Link href="/support" className="text-muted hover:text-foreground">
                Contact Support
              </Link>
            </li>
            <li>
              <a href={`mailto:${EXTERNAL.supportEmail}`} className="text-muted hover:text-foreground">
                {EXTERNAL.supportEmail}
              </a>
            </li>
            <li>
              <Link href="/troubleshooting" className="text-muted hover:text-foreground">
                Troubleshooting
              </Link>
            </li>
            <li>
              <Link href="/release-notes" className="text-muted hover:text-foreground">
                Release Notes
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-6">
        <div className="container-site flex flex-col gap-2 text-xs text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Baalvion. All rights reserved.</p>
          <p>help.baalvion.com</p>
        </div>
      </div>
    </footer>
  );
}
