import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page/page-shell';
import { ROUTES } from '@/lib/content';
import { RELIABILITY } from '@/lib/site-pages';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Platform Reliability',
  description:
    'What is live today across the Baalvion network, how the identity layer works, and how we describe our own stage — stated plainly, not blurred with what is still being built.',
  path: ROUTES.trustReliability,
});

const BLOCKS = [RELIABILITY.today, RELIABILITY.identity, RELIABILITY.principle, RELIABILITY.stage];

export default function ReliabilityPage() {
  return (
    <PageShell
      folio={RELIABILITY.folio}
      label={RELIABILITY.label}
      eyebrow={RELIABILITY.eyebrow}
      title={RELIABILITY.title}
      lede={RELIABILITY.lede}
      breadcrumbs={[{ label: 'Trust Center', href: ROUTES.trust }]}
    >
      <section className="border-b hairline bg-ink">
        <div className="site-container py-16 md:py-20">
          <div className="grid gap-px sm:grid-cols-2">
            {BLOCKS.map((block) => (
              <div key={block.label} className="bg-surface p-8">
                <p className="mono-label mb-3 text-accent">{block.label}</p>
                <p className="body">{block.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-deep">
        <div className="site-container flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <p className="lead max-w-xl">
            See each domain’s live platform directly, or review how governance is structured
            around it.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/#network" className="btn-primary">
              View the network <span aria-hidden="true">→</span>
            </Link>
            <Link href={ROUTES.trustGovernance} className="btn-ghost">
              Governance <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
