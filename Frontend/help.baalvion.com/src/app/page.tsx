import Link from 'next/link';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { HomeHeroSearch } from '@/components/site/home-hero-search';
import { EXTERNAL } from '@/lib/site';

const ROLE_GUIDES = [
  {
    href: '/guides/buyer',
    title: 'Buyer Guide',
    description: 'Sourcing, orders, and tracking trades from your buyer dashboard.',
  },
  {
    href: '/guides/seller',
    title: 'Seller Guide',
    description: 'Managing listings, fulfilling orders, and growing trade volume.',
  },
  {
    href: '/guides/agent',
    title: 'Trade Agent Guide',
    description: 'Coordinating tasks, approvals, and communication between parties.',
  },
];

const POPULAR_ARTICLES = [
  { href: '/getting-started/logging-in', title: 'Logging In & Role-Based Routing' },
  { href: '/getting-started/creating-an-account', title: 'Creating an Account' },
  { href: '/getting-started/password-reset', title: 'Resetting Your Password' },
  { href: '/platform/permissions', title: 'How Permissions Work' },
  { href: '/api/authentication', title: 'API Authentication' },
  { href: '/troubleshooting', title: 'Troubleshooting Login Issues' },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-line bg-surface/50">
          <div className="container-site flex flex-col items-center gap-6 py-20 text-center sm:py-28">
            <span className="rounded-full border border-line-strong bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted">
              Baalvion Help Center
            </span>
            <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Everything you need to run trade on Baalvion
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted">
              Onboarding guides, platform documentation, and API reference for buyers, sellers, trade agents, and
              developers.
            </p>
            <HomeHeroSearch />
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/getting-started/what-is-baalvion" className="btn-primary">
                Get Started
              </Link>
              <Link href="/api/overview" className="btn-secondary">
                API Documentation
              </Link>
            </div>
          </div>
        </section>

        <section className="container-site py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-foreground">Start with your role</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {ROLE_GUIDES.map((guide) => (
              <Link key={guide.href} href={guide.href} className="doc-card group flex flex-col">
                <p className="font-semibold text-foreground">{guide.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{guide.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-strong">
                  Read the guide
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-line bg-surface/50 py-16">
          <div className="container-site grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">Popular articles</h2>
              <ul className="mt-6 flex flex-col gap-1">
                {POPULAR_ARTICLES.map((article) => (
                  <li key={article.href}>
                    <Link
                      href={article.href}
                      className="focus-ring flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground transition hover:bg-surface-2"
                    >
                      {article.title}
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4 text-muted-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="font-display text-2xl font-semibold text-foreground">Explore documentation</h2>
              <Link href="/getting-started/what-is-baalvion" className="doc-card">
                <p className="font-semibold text-foreground">Getting Started</p>
                <p className="mt-1 text-sm text-muted">Accounts, login, onboarding, and system requirements.</p>
              </Link>
              <Link href="/platform/dashboard-system" className="doc-card">
                <p className="font-semibold text-foreground">Platform Documentation</p>
                <p className="mt-1 text-sm text-muted">Dashboards, navigation, permissions, and security.</p>
              </Link>
              <Link href="/api/overview" className="doc-card">
                <p className="font-semibold text-foreground">API Documentation</p>
                <p className="mt-1 text-sm text-muted">Authentication, endpoints, webhooks, and code samples.</p>
              </Link>
            </div>
          </div>
        </section>

        <section className="container-site py-16">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <a
              href={EXTERNAL.statusPage}
              target="_blank"
              rel="noopener noreferrer"
              className="doc-card flex items-center gap-3"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-ok" />
              <div>
                <p className="font-semibold text-foreground">System Status</p>
                <p className="text-sm text-muted">Check real-time platform availability.</p>
              </div>
            </a>
            <Link href="/troubleshooting" className="doc-card">
              <p className="font-semibold text-foreground">Troubleshooting</p>
              <p className="mt-1 text-sm text-muted">Fixes for login, access, and dashboard issues.</p>
            </Link>
            <Link href="/support" className="doc-card border-accent/30 bg-accent/[0.05]">
              <p className="font-semibold text-foreground">Contact Support</p>
              <p className="mt-1 text-sm text-muted">Can&rsquo;t find an answer? Reach the Baalvion team.</p>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
