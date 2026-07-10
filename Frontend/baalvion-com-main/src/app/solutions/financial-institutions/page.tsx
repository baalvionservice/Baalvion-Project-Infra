import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { SolutionSections } from '@/components/page/solution-sections';
import { ROUTES } from '@/lib/content';
import { SOLUTIONS_FINANCIAL } from '@/lib/site-pages';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Solutions for Financial Institutions',
  description:
    'Settlement, ledgering, and reconciliation built to institutional tolerance — the Market & Financial Systems domain, explained for financial-institution counterparties.',
  path: ROUTES.solutionsFinancial,
});

export default function FinancialInstitutionsSolutionPage() {
  const page = SOLUTIONS_FINANCIAL;
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
