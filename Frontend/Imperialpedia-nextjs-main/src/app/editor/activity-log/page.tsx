import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/editorial` fabricated activity/audit entries. No real
 * audit backend exists yet — see the mock-data remediation report.
 */
export default function EditorActivityLogPage() {
  return (
    <FeatureUnavailable
      title="Activity Log"
      reason="The editorial activity log isn't connected to a live audit backend yet."
      backHref="/editor"
      backLabel="Back to Editor"
    />
  );
}
