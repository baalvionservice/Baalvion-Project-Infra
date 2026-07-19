import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/editorial` fabricated submissions. No real editorial
 * queue backend exists yet — see the mock-data remediation report.
 */
export default function EditorQueuePage() {
  return (
    <FeatureUnavailable
      title="Submission Queue"
      reason="The submission queue isn't connected to a live data source yet."
      backHref="/editor"
      backLabel="Back to Editor"
    />
  );
}
