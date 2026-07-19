import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/editorial` fabricated submissions into ReviewConsole. No
 * real editorial submission backend exists yet — see the mock-data remediation report.
 */
export default function EditorReviewPage() {
  return (
    <FeatureUnavailable
      title="Article Review"
      reason="Article review isn't connected to a live submissions backend yet."
      backHref="/editor"
      backLabel="Back to Editor"
    />
  );
}
