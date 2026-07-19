import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/creators.getCreatorSettings()` and letting users "save"
 * changes that were never persisted anywhere. No real settings backend exists yet
 * — see the mock-data remediation report. Silently discarding saved settings is
 * its own form of presenting fake functionality as real, so this is hidden rather
 * than shown as an editable (but non-persisting) form.
 */
export default function CreatorSettingsPage() {
  return (
    <FeatureUnavailable
      title="Studio Settings"
      reason="Profile and notification settings aren't connected to a live backend yet, so changes can't be saved."
      backHref="/creator/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
