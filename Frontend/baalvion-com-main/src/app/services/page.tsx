import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page/page-shell';
import { ROUTES } from '@/lib/content';
import { SERVICES } from '@/lib/site-pages';

export const metadata: Metadata = {
  title: 'Platform & Services',
  description:
    'The four domains Baalvion operates — trade infrastructure, market and financial systems, ecosystem platforms, and intelligence systems — on one operational fabric with a single passwordless account layer.',
  alternates: { canonical: '/services' },
};

export default function ServicesPage() {
  return (
    <PageShell
      folio={SERVICES.folio}
      label={SERVICES.label}
      eyebrow={SERVICES.eyebrow}
      title={SERVICES.title}
      lede={SERVICES.lede}
    >
      {/* Domains */}
      <section className="border-b hairline bg-ink">
        <div className="site-container py-16 md:py-20">
          <div className="grid gap-px lg:grid-cols-2">
            {SERVICES.domains.map((d) => (
              <article key={d.title} className="bg-surface p-8 md:p-10">
                <p className="mono-label mb-4 text-accent">{d.index}</p>
                <h2 className="display-h3 mb-1">{d.title}</h2>
                <p className="mono-caption mb-5">{d.tagline}</p>
                <p className="body mb-6">{d.body}</p>
                <ul className="flex flex-wrap gap-2">
                  {d.capabilities.map((c) => (
                    <li
                      key={c}
                      className="border hairline px-3 py-1 text-xs text-foreground/80"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Account layer */}
      <section className="border-b hairline bg-ink-deep">
        <div className="site-container grid gap-10 py-16 md:py-20 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <p className="mono-label mb-4 text-accent">{SERVICES.account.label}</p>
            <h2 className="running-head">{SERVICES.account.title}</h2>
          </div>
          <div className="lg:col-span-8">
            <p className="body-lg mb-6">{SERVICES.account.body}</p>
            <div className="flex flex-wrap gap-4">
              <Link href={ROUTES.register} className="btn-primary">
                Create an account <span aria-hidden="true">→</span>
              </Link>
              <Link href={ROUTES.email} className="btn-ghost">
                How we use email <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA to network */}
      <section className="bg-ink">
        <div className="site-container flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <p className="lead max-w-xl">
            The full network of platforms and independent brands is indexed on the homepage.
          </p>
          <Link href="/#network" className="btn-primary">
            View the network <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
