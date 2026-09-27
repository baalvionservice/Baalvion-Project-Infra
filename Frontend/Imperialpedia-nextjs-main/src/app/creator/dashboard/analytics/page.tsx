import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/creators.getCreatorAnalytics()` fabricated engagement
 * metrics. No real analytics backend exists yet — see the mock-data remediation
 * report.
 */
export default function CreatorAnalyticsPage() {
  return (
    <FeatureUnavailable
      title="Creator Analytics"
      reason="Content analytics aren't connected to a live data source yet."
      backHref="/creator/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
