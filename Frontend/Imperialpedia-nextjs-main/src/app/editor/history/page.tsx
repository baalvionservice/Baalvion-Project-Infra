import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/audit` fabricated review history. No real audit backend
 * exists yet — see the mock-data remediation report.
 */
export default function EditorHistoryPage() {
  return (
    <FeatureUnavailable
      title="Review History"
      reason="Review history isn't connected to a live audit backend yet."
      backHref="/editor"
      backLabel="Back to Editor"
    />
  );
}
