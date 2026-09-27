import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

export const metadata: Metadata = buildMetadata({
  title: 'Performance Hub | Imperialpedia',
  description: 'Premium business analytics are in development for Imperialpedia.',
});

/**
 * Was rendering `mock-api/premium.getPremiumDashboardData()` fabricated growth,
 * revenue, and cohort metrics. No real premium analytics backend exists yet — see
 * the mock-data remediation report.
 */
export default function PremiumDashboardPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <FeatureUnavailable
        title="Performance Hub"
        reason="Premium business analytics aren't connected to a live data source yet."
        backHref="/premium/subscribe"
        backLabel="Back to Premium"
      />
    </main>
  );
}
