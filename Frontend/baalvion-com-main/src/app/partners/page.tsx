import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { SolutionSections } from '@/components/page/solution-sections';
import { ROUTES } from '@/lib/content';
import { PARTNERS_PAGE } from '@/lib/site-pages';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Partners',
  description:
    'Platform integration partners, financial and settlement partners, and portfolio brand operators — how partnership works across the Baalvion foundation.',
  path: ROUTES.partners,
});

export default function PartnersPage() {
  const page = PARTNERS_PAGE;
  return (
    <PageShell
      folio={page.folio}
      label={page.label}
      eyebrow={page.eyebrow}
      title={page.title}
      lede={page.lede}
      breadcrumbs={[{ label: 'Solutions', href: ROUTES.solutions }]}
    >
      <SolutionSections sections={page.sections} closing={page.closing} cta={page.cta} />
    </PageShell>
  );
}
