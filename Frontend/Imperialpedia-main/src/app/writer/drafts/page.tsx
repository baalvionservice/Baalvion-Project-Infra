import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering hardcoded mock drafts. No real drafts backend exists yet — see the
 * mock-data remediation report.
 */
export default function WriterDraftsPage() {
  return (
    <FeatureUnavailable
      title="Drafts"
      reason="Draft management isn't connected to a live data source yet."
      backHref="/writer"
      backLabel="Back to Writer Dashboard"
    />
  );
}
