import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/version-control` fabricated version history. No real
 * version-control backend exists yet — see the mock-data remediation report.
 */
export default function EditorReviewHistoryPage() {
  return (
    <FeatureUnavailable
      title="Version History"
      reason="Article version history isn't connected to a live data source yet."
      backHref="/editor"
      backLabel="Back to Editor"
    />
  );
}
