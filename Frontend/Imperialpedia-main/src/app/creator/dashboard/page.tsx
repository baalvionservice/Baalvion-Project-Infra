import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/creators` fabricated dashboard stats and content list.
 * No real creator-dashboard analytics backend exists yet — see the mock-data
 * remediation report. For the creator's actual live profile see /creator/[id].
 */
export default function CreatorDashboardPage() {
  return (
    <FeatureUnavailable
      title="Creator Dashboard"
      reason="Dashboard analytics aren't connected to a live data source yet. Your public profile and published articles are live at /creator/[id]."
      backHref="/creator/dashboard/create"
      backLabel="Write a New Article"
    />
  );
}
