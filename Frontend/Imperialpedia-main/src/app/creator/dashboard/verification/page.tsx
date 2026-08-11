import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

export const metadata: Metadata = buildMetadata({
  title: 'Creator Verification | Imperialpedia',
  description: 'Creator verification is in development for Imperialpedia.',
});

/**
 * Was rendering a fake submission flow (simulated API delay, hardcoded document
 * list, and a permanently hardcoded demo user's status regardless of who was
 * logged in) with copy claiming review by "platform leads" and a "Compliance
 * Hub" that don't exist, plus fabricated incentive claims ("3.5x more
 * visibility", "exclusive grants"). Removed entirely rather than fixed in
 * place, per the site's real-data-first policy — see the mock-data
 * remediation report and FeatureUnavailable's doc comment.
 */
export default function CreatorVerificationPage() {
  return (
    <FeatureUnavailable
      title="Creator Verification"
      reason="Creator verification isn't connected to a live review process yet."
      backHref="/creator/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
