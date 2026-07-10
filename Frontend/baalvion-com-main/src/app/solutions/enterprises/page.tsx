import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { SolutionSections } from '@/components/page/solution-sections';
import { ROUTES } from '@/lib/content';
import { SOLUTIONS_ENTERPRISES } from '@/lib/site-pages';

export const metadata: Metadata = {
  title: 'Solutions for Enterprises & Institutions',
  description:
    'Operating environments built for institutional dependence — one identity layer, tenant isolation, and governance shared across every Baalvion platform.',
  alternates: { canonical: '/solutions/enterprises' },
};

export default function EnterprisesSolutionPage() {
  const page = SOLUTIONS_ENTERPRISES;
  return (
    <PageShell
      folio={page.folio}
      label={page.label}
      eyebrow={page.eyebrow}
      title={page.title}
      lede={page.lede}
      breadcrumbs={[{ label: 'Solutions', href: ROUTES.solutions }]}
    >
      <SolutionSections
        sections={page.sections}
        closing={page.closing}
        cta={page.cta}
        ctaSecondary={page.ctaSecondary}
      />
    </PageShell>
  );
}
