import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page/page-shell';
import { CONTACT, ROUTES } from '@/lib/content';
import { GOVERNANCE } from '@/lib/site-pages';

export const metadata: Metadata = {
  title: 'Governance',
  description:
    'How Baalvion is structured, how jurisdiction and tenant isolation are treated as architecture, and how accountability is enforced across the foundation.',
  alternates: { canonical: '/trust/governance' },
};

export default function GovernancePage() {
  return (
    <PageShell
      folio={GOVERNANCE.folio}
      label={GOVERNANCE.label}
      eyebrow={GOVERNANCE.eyebrow}
      title={GOVERNANCE.title}
      lede={GOVERNANCE.lede}
      breadcrumbs={[{ label: 'Trust Center', href: ROUTES.trust }]}
    >
      <section className="border-b hairline bg-ink">
        <div className="site-container grid gap-10 py-16 md:py-20 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <p className="mono-label mb-4 text-accent">{GOVERNANCE.structure.label}</p>
            <h2 className="running-head">Three layers, one standard.</h2>
          </div>
          <p className="body-lg lg:col-span-8">{GOVERNANCE.structure.body}</p>
        </div>
      </section>

      <section className="border-b hairline bg-ink-deep">
        <div className="site-container grid gap-10 py-16 md:py-20 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <p className="mono-label mb-4 text-accent">{GOVERNANCE.isolation.label}</p>
            <h2 className="running-head">Architecture, not configuration.</h2>
          </div>
          <p className="body-lg lg:col-span-8">{GOVERNANCE.isolation.body}</p>
        </div>
      </section>

      <section className="border-b hairline bg-ink">
        <div className="site-container grid gap-10 py-16 md:py-20 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <p className="mono-label mb-4 text-accent">{GOVERNANCE.accountability.label}</p>
            <h2 className="running-head">Held to it, in practice.</h2>
          </div>
          <ul className="space-y-4 lg:col-span-8">
            {GOVERNANCE.accountability.items.map((item) => (
              <li key={item.slice(0, 24)} className="body flex gap-3">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-ink-deep">
        <div className="site-container flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <p className="lead max-w-xl">
            Regulatory or legal enquiries reach the same team accountable for this page directly.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href={`mailto:${CONTACT.legal}`} className="btn-primary">
              {CONTACT.legal} <span aria-hidden="true">→</span>
            </a>
            <Link href={ROUTES.trustReliability} className="btn-ghost">
              Platform Reliability <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
