import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { LegalArticle } from '@/components/page/legal-article';
import { LEGAL_DOCS } from '@/lib/legal';
import { pageMetadata } from '@/lib/seo';

const doc = LEGAL_DOCS.terms;

export const metadata: Metadata = pageMetadata({
  title: doc.title,
  description: doc.summary,
  path: '/legal/terms',
});

export default function TermsPage() {
  return (
    <PageShell folio="§ 06" label="Legal" eyebrow="Policies" title={doc.title} lede={doc.summary}>
      <LegalArticle doc={doc} />
    </PageShell>
  );
}
