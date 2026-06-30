import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { LegalArticle } from '@/components/page/legal-article';
import { LEGAL_DOCS } from '@/lib/legal';

const doc = LEGAL_DOCS.privacy;

export const metadata: Metadata = {
  title: doc.title,
  description: doc.summary,
  alternates: { canonical: '/legal/privacy' },
};

export default function PrivacyPage() {
  return (
    <PageShell folio="§ 06" label="Legal" eyebrow="Policies" title={doc.title} lede={doc.summary}>
      <LegalArticle doc={doc} />
    </PageShell>
  );
}
