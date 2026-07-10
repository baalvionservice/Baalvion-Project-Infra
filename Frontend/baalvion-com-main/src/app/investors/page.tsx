import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { SCALE } from '@/lib/content';
import { INVESTORS_PAGE } from '@/lib/site-pages';

export const metadata: Metadata = {
  title: 'Investors',
  description:
    'A long-horizon foundation, evaluated on its own terms — the posture stated plainly on-site, with the full thesis maintained at ir.baalvion.com.',
  alternates: { canonical: '/investors' },
};

export default function InvestorsPage() {
  return (
    <PageShell
      folio={INVESTORS_PAGE.folio}
      label={INVESTORS_PAGE.label}
      eyebrow={INVESTORS_PAGE.eyebrow}
      title={INVESTORS_PAGE.title}
      lede={INVESTORS_PAGE.lede}
    >
      <section className="border-b hairline bg-ink">
        <div className="site-container py-16 md:py-20">
          <h2 className="running-head mb-10 max-w-2xl">The thesis, in four points.</h2>
          <ul className="grid gap-px sm:grid-cols-2">
            {INVESTORS_PAGE.points.map((point) => (
              <li key={point.slice(0, 24)} className="body bg-surface p-8">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b hairline bg-ink-deep">
        <div className="site-container py-16 md:py-20">
          <p className="mono-caption mb-6">{SCALE.caption}</p>
          <div className="grid grid-cols-2 gap-px border hairline bg-line sm:grid-cols-3">
            {SCALE.figures.map((figure) => (
              <div key={figure.caption} className="bg-ink-deep p-6 md:p-8">
                <p className="font-display text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] leading-tight text-foreground">
                  {figure.value}
                  {figure.suffix ?? ''}
                </p>
                <p className="body mt-3 max-w-[24ch] text-sm">{figure.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink">
        <div className="site-container flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <p className="lead max-w-xl">
            This page states the posture; the full long-horizon thesis, governance detail, and
            capitalisation history are maintained at ir.baalvion.com.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href={INVESTORS_PAGE.cta.href} className="btn-primary">
              {INVESTORS_PAGE.cta.label} <span aria-hidden="true">↗</span>
            </a>
            <a href={INVESTORS_PAGE.ctaSecondary.href} className="btn-ghost">
              {INVESTORS_PAGE.ctaSecondary.label} <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
