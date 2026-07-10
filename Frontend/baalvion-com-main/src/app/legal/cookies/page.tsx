import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { LegalArticle } from '@/components/page/legal-article';
import { LEGAL_DOCS } from '@/lib/legal';
import { pageMetadata } from '@/lib/seo';

const doc = LEGAL_DOCS.cookies;

export const metadata: Metadata = pageMetadata({
  title: doc.title,
  description: doc.summary,
  path: '/legal/cookies',
});

export default function CookiesPage() {
  return (
    <PageShell folio="§ 06" label="Legal" eyebrow="Policies" title={doc.title} lede={doc.summary}>
      <LegalArticle doc={doc} />
    </PageShell>
  );
}
