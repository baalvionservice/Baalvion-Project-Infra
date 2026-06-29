import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page/page-shell';
import { ROUTES } from '@/lib/content';
import { ABOUT } from '@/lib/site-pages';

export const metadata: Metadata = {
  title: 'About Baalvion',
  description:
    'Baalvion is a multi-jurisdiction holding company for foundational infrastructure — the systems beneath global trade, markets, and digital ecosystems. Read our mission, vision, and values.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <PageShell
      folio={ABOUT.folio}
      label={ABOUT.label}
      eyebrow={ABOUT.eyebrow}
      title={ABOUT.title}
      lede={ABOUT.lede}
    >
      {/* Overview */}
      <section className="border-b hairline bg-ink">
        <div className="site-container grid gap-10 py-16 md:py-20 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <h2 className="running-head">What Baalvion is</h2>
          </div>
          <div className="space-y-6 lg:col-span-8">
            {ABOUT.overview.map((p) => (
              <p key={p.slice(0, 24)} className="body-lg">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="border-b hairline bg-ink-deep">
        <div className="site-container grid gap-px py-16 md:grid-cols-2 md:py-20">
          {[ABOUT.mission, ABOUT.vision].map((block) => (
            <div key={block.label} className="bg-surface p-8 md:p-10">
              <p className="mono-label mb-4 text-accent">{block.label}</p>
              <p className="lead">{block.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="border-b hairline bg-ink">
        <div className="site-container py-16 md:py-20">
          <h2 className="running-head mb-10">How we operate</h2>
          <div className="grid gap-px sm:grid-cols-2">
            {ABOUT.values.map((v) => (
              <div key={v.title} className="bg-surface p-8">
                <h3 className="display-h3 mb-3">{v.title}</h3>
                <p className="body">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facts */}
      <section className="border-b hairline bg-ink-deep">
        <div className="site-container grid grid-cols-2 gap-px py-16 md:grid-cols-4">
          {ABOUT.facts.map((f) => (
            <div key={f.caption} className="bg-surface p-8 text-center">
              <p className="display-h3 text-paper">{f.value}</p>
              <p className="mono-caption mt-2">{f.caption}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink">
        <div className="site-container flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <p className="lead max-w-xl">
            Explore the platforms we operate, or speak to the foundation directly.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={ROUTES.services} className="btn-primary">
              Platform &amp; services <span aria-hidden="true">→</span>
            </Link>
            <Link href={ROUTES.contact} className="btn-ghost">
              Contact us <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
