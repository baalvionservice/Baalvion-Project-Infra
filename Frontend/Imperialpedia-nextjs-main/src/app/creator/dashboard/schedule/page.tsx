import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/creators.getScheduledContent()` fabricated publishing
 * calendar. No real scheduling backend exists yet — see the mock-data remediation
 * report.
 */
export default function CreatorSchedulePage() {
  return (
    <FeatureUnavailable
      title="Content Schedule"
      reason="The publishing calendar isn't connected to a live data source yet."
      backHref="/creator/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
