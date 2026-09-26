import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering hardcoded inline "Mock Writer Stats" / "Mock Drafts" arrays as a
 * live dashboard. No real writer-dashboard backend exists yet — see the mock-data
 * remediation report.
 */
export default function WriterDashboardPage() {
  return (
    <FeatureUnavailable
      title="Writer Dashboard"
      reason="Writer dashboard stats aren't connected to a live data source yet. Use New Article to start writing."
      backHref="/writer/new"
      backLabel="Start a New Article"
    />
  );
}
