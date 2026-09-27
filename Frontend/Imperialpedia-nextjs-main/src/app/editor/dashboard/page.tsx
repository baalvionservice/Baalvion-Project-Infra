import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/editorial` fabricated dashboard metrics. No real editorial
 * analytics backend exists yet — see the mock-data remediation report.
 */
export default function EditorDashboardPage() {
  return (
    <FeatureUnavailable
      title="Editorial Dashboard"
      reason="Editorial dashboard metrics aren't connected to a live data source yet."
      backHref="/editor"
      backLabel="Back to Editor"
    />
  );
}
