import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page/page-shell';
import { ROUTES } from '@/lib/content';
import { SOLUTIONS_HUB } from '@/lib/site-pages';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Solutions',
  description:
    'How Baalvion is engaged by enterprises and institutions, financial institutions, governments and regulators, partners, and investors.',
  path: ROUTES.solutions,
});

export default function SolutionsPage() {
  return (
    <PageShell
      folio={SOLUTIONS_HUB.folio}
      label={SOLUTIONS_HUB.label}
      eyebrow={SOLUTIONS_HUB.eyebrow}
      title={SOLUTIONS_HUB.title}
      lede={SOLUTIONS_HUB.lede}
    >
      <section className="bg-ink">
        <div className="site-container py-16 md:py-20">
          <div className="grid gap-px border hairline bg-line sm:grid-cols-2">
            {SOLUTIONS_HUB.audiences.map((audience) => (
              <Link
                key={audience.title}
                href={audience.href}
                className="group flex flex-col justify-between bg-ink p-8 transition-colors duration-200 hover:bg-surface md:p-10"
              >
                <div>
                  <h2 className="display-h3 mb-3">{audience.title}</h2>
                  <p className="body">{audience.body}</p>
                </div>
                <p className="mono-caption mt-8 text-accent transition-colors group-hover:text-accent-ink">
                  Read more <span aria-hidden="true">→</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
