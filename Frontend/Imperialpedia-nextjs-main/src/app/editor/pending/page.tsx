import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/articles` fabricated submission list. No real editorial
 * queue backend exists yet — see the mock-data remediation report.
 */
export default function EditorPendingPage() {
  return (
    <FeatureUnavailable
      title="Pending Review Queue"
      reason="The pending-review queue isn't connected to a live data source yet."
      backHref="/editor"
      backLabel="Back to Editor"
    />
  );
}
