import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { ROUTES, SCALE } from '@/lib/content';
import { BUILT_PROPERTIES, COMPANY_FACTS, INVESTORS_PAGE } from '@/lib/site-pages';
import { pageMetadata } from '@/lib/seo';
import { CIN, INCORPORATED_ON, LEGAL_ENTITY_NAME } from '@baalvion/company';

const incorporated = new Date(INCORPORATED_ON).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const metadata: Metadata = pageMetadata({
  title: 'Investors',
  description:
    'A long-horizon foundation, evaluated on its own terms — the posture stated plainly on-site, with the full thesis maintained at ir.baalvion.com.',
  path: ROUTES.investors,
});

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
        <div className="site-container grid gap-12 py-16 md:grid-cols-2 md:py-20">
          <div>
            <p className="mono-caption mb-6">{COMPANY_FACTS.caption}</p>
            <h2 className="running-head mb-8">{COMPANY_FACTS.title}</h2>
            {COMPANY_FACTS.story.map((para) => (
              <p key={para.slice(0, 24)} className="body mb-4 max-w-xl">
                {para}
              </p>
            ))}
          </div>
          <dl className="grid content-start gap-px border hairline bg-line">
            {[
              ['Legal entity', LEGAL_ENTITY_NAME],
              ['Incorporated', incorporated],
              ['CIN', CIN],
              ['Directors', COMPANY_FACTS.directors.join(' · ')],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface p-5">
                <dt className="mono-caption">{k}</dt>
                <dd className="body mt-1 text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b hairline bg-ink">
        <div className="site-container py-16 md:py-20">
          <p className="mono-caption mb-6">{BUILT_PROPERTIES.caption}</p>
          <h2 className="running-head mb-4 max-w-2xl">{BUILT_PROPERTIES.title}</h2>
          <p className="lead mb-10 max-w-2xl">{BUILT_PROPERTIES.lede}</p>
          <ul className="grid gap-px border hairline bg-line sm:grid-cols-2 lg:grid-cols-3">
            {BUILT_PROPERTIES.items.map((item) => (
              <li key={item.host} className="bg-surface p-6">
                <a href={`https://${item.host}`} className="font-display text-lg text-foreground">
                  {item.name}
                </a>
                <p className="body mt-1 text-sm">{item.host}</p>
                {'note' in item && <p className="body mt-3 text-sm">{item.note}</p>}
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
            capitalisation history are maintained at ir.baalvion.com. Investment is by invitation to identified persons only; request access and we will respond individually.
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
