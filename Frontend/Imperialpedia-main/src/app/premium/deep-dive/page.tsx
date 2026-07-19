import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

export const metadata: Metadata = buildMetadata({
  title: 'Portfolio Deep-Dive | Imperialpedia',
  description: 'AI-assisted portfolio deep-dive analysis is in development for Imperialpedia.',
});

/**
 * Was rendering `mock-api/premium.getPortfolioDeepDiveData()` fabricated "AI risk
 * signals". No real portfolio-analysis backend exists yet — see the mock-data
 * remediation report.
 */
export default function PremiumDeepDivePage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <FeatureUnavailable
        title="Portfolio Deep-Dive"
        reason="Portfolio deep-dive analysis isn't connected to a live data source yet."
        backHref="/premium/subscribe"
        backLabel="Back to Premium"
      />
    </main>
  );
}
