import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/articles` submission counts as a live editorial queue.
 * No real editorial backend exists yet — see the mock-data remediation report.
 */
export default function EditorHomePage() {
  return (
    <FeatureUnavailable
      title="Editorial Command"
      reason="The editorial queue isn't connected to a live submissions backend yet."
      backHref="/"
    />
  );
}
