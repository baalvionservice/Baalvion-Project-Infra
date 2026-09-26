import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

export const metadata: Metadata = buildMetadata({
  title: 'Article Editor | Imperialpedia',
  description: 'Creator article editing is in development for Imperialpedia.',
});

/**
 * Was a complete fake: "Publish"/"Save Draft" only ran a setTimeout and
 * claimed the article was "now live and indexed for platform-wide reach" —
 * no API call, nothing ever saved or published anywhere. Removed entirely
 * rather than fixed in place, per the site's real-data-first policy — see
 * the mock-data remediation report and FeatureUnavailable's doc comment.
 */
export default function CreatorEditorPage() {
  return (
    <FeatureUnavailable
      title="Article Editor"
      reason="Creator article editing isn't connected to a live publishing pipeline yet."
      backHref="/creator/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
