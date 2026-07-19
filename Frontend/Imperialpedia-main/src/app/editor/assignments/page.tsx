import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/editorial` fabricated reviewer workload data. No real
 * assignment backend exists yet — see the mock-data remediation report.
 */
export default function EditorAssignmentsPage() {
  return (
    <FeatureUnavailable
      title="Editorial Assignments"
      reason="Reviewer assignments aren't connected to a live data source yet."
      backHref="/editor"
      backLabel="Back to Editor"
    />
  );
}
