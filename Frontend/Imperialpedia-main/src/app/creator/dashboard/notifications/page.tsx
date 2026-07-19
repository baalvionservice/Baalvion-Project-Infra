import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/creators.getCreatorNotifications()` fabricated activity
 * feed. No real notifications backend exists yet — see the mock-data remediation
 * report.
 */
export default function CreatorNotificationsPage() {
  return (
    <FeatureUnavailable
      title="Activity Feed"
      reason="The activity feed isn't connected to a live data source yet."
      backHref="/creator/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
