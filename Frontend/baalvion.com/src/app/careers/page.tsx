import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { ROUTES } from '@/lib/content';
import { CAREERS_PAGE } from '@/lib/site-pages';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Careers',
  description:
    'Work across the Baalvion foundation — trade and logistics engineering, market and financial systems, ecosystem and identity platforms, and applied intelligence. Open roles are listed on the Talent platform.',
  path: ROUTES.careers,
});

export default function CareersPage() {
  return (
    <PageShell
      folio={CAREERS_PAGE.folio}
      label={CAREERS_PAGE.label}
      eyebrow={CAREERS_PAGE.eyebrow}
      title={CAREERS_PAGE.title}
      lede={CAREERS_PAGE.lede}
    >
      <section className="bg-ink">
        <div className="site-container grid gap-10 py-16 md:py-20 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <h2 className="running-head">Where the work happens</h2>
          </div>
          <div className="lg:col-span-8">
            <p className="body-lg mb-10">{CAREERS_PAGE.body}</p>
            <div className="flex flex-wrap gap-4">
              <a href={CAREERS_PAGE.cta.href} className="btn-primary">
                {CAREERS_PAGE.cta.label} <span aria-hidden="true">↗</span>
              </a>
              <a href={CAREERS_PAGE.ctaSecondary.href} className="btn-ghost">
                {CAREERS_PAGE.ctaSecondary.label} <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
