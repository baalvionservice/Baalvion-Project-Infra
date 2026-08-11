import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

export const metadata: Metadata = buildMetadata({
  title: 'Write a New Article | Imperialpedia',
  description: 'Creator article submission is in development for Imperialpedia.',
});

/**
 * Was a complete fake: "Publish"/"Save Draft" only ran a setTimeout and showed
 * a toast claiming the article "is being processed by the Content Engine" —
 * no API call, nothing ever saved or submitted anywhere. A real creator could
 * write a full article, click Publish, and lose it with no warning. Removed
 * entirely rather than fixed in place, per the site's real-data-first policy
 * — see the mock-data remediation report and FeatureUnavailable's doc comment.
 */
export default function CreateInsightPage() {
  return (
    <FeatureUnavailable
      title="Article Submission"
      reason="Creator article submission isn't connected to a live publishing pipeline yet."
      backHref="/creator/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
