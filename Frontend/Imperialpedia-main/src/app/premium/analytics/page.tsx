import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

export const metadata: Metadata = buildMetadata({
  title: 'Advanced Analytics Suite | Imperialpedia',
  description: 'Advanced portfolio and sentiment analytics are in development for Imperialpedia.',
});

/**
 * Was rendering `mock-api/premium.getPremiumAnalytics()` fabricated sentiment and
 * strategy-modeling data. No real premium analytics backend exists yet — see the
 * mock-data remediation report.
 */
export default function PremiumAnalyticsPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <FeatureUnavailable
        title="Advanced Analytics Suite"
        reason="Advanced analytics aren't connected to a live data source yet."
        backHref="/premium/subscribe"
        backLabel="Back to Premium"
      />
    </main>
  );
}
