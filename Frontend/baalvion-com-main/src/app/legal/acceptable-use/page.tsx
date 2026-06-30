import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { LegalArticle } from '@/components/page/legal-article';
import { LEGAL_DOCS } from '@/lib/legal';

const doc = LEGAL_DOCS['acceptable-use'];

export const metadata: Metadata = {
  title: doc.title,
  description: doc.summary,
  alternates: { canonical: '/legal/acceptable-use' },
};

export default function AcceptableUsePage() {
  return (
    <PageShell folio="§ 06" label="Legal" eyebrow="Policies" title={doc.title} lede={doc.summary}>
      <LegalArticle doc={doc} />
    </PageShell>
  );
}
