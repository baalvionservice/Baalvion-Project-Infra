import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering hardcoded mock submissions. No real submissions backend exists yet
 * — see the mock-data remediation report.
 */
export default function WriterSubmissionsPage() {
  return (
    <FeatureUnavailable
      title="Submissions"
      reason="Submission tracking isn't connected to a live data source yet."
      backHref="/writer"
      backLabel="Back to Writer Dashboard"
    />
  );
}
