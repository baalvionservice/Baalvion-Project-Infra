import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { SolutionSections } from '@/components/page/solution-sections';
import { ROUTES } from '@/lib/content';
import { SOLUTIONS_GOVERNMENTS } from '@/lib/site-pages';

export const metadata: Metadata = {
  title: 'Solutions for Governments & Regulators',
  description:
    'Infrastructure designed to be examined — compliance, jurisdictional isolation, and a direct regulatory channel into Baalvion’s governance posture.',
  alternates: { canonical: '/solutions/governments' },
};

export default function GovernmentsSolutionPage() {
  const page = SOLUTIONS_GOVERNMENTS;
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
