import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

export const metadata: Metadata = buildMetadata({
  title: 'Strategy Backtesting Terminal | Imperialpedia',
  description: 'Strategy backtesting against historical market data is in development for Imperialpedia.',
});

/**
 * Was rendering `mock-api/premium.getBacktestData()` fabricated strategies and
 * equity curves. No real historical-data/backtesting backend exists yet — see the
 * mock-data remediation report.
 */
export default function BacktestingTerminalPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <FeatureUnavailable
        title="Strategy Backtesting Terminal"
        reason="Backtesting isn't connected to a live historical-data source yet."
        backHref="/premium/subscribe"
        backLabel="Back to Premium"
      />
    </main>
  );
}
