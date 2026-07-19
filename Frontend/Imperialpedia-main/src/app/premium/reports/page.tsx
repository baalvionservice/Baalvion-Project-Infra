import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

export const metadata: Metadata = buildMetadata({
  title: 'Intelligence Reports | Imperialpedia',
  description: 'Premium research reports are in development for Imperialpedia.',
});

/**
 * Was rendering `mock-api/premium.getPremiumReports()` — reports whose own
 * `description` field literally read "Mock analysis..." / "Mock sentiment
 * analysis..." and was rendered verbatim to signed-in users. No real research
 * backend exists yet — see the mock-data remediation report.
 */
export default function PremiumReportsPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <FeatureUnavailable
        title="Intelligence Reports"
        reason="Premium research reports aren't connected to a live data source yet."
        backHref="/premium/subscribe"
        backLabel="Back to Premium"
      />
    </main>
  );
}
