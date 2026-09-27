import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/creators.getCreatorRevenue()` / `getPayoutHistory()`
 * fabricated earnings and payout records. No real payouts backend exists yet —
 * see the mock-data remediation report. This is financial data, so it must never
 * show fabricated numbers.
 */
export default function CreatorRevenuePage() {
  return (
    <FeatureUnavailable
      title="Revenue & Payouts"
      reason="Revenue and payout history aren't connected to a live billing backend yet."
      backHref="/creator/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
