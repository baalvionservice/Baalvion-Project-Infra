import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

/**
 * Was rendering `mock-api/articles` fabricated submitted-articles workflow. No real
 * editorial workflow backend exists yet — see the mock-data remediation report.
 */
export default function EditorWorkflowPage() {
  return (
    <FeatureUnavailable
      title="Editorial Workflow"
      reason="The editorial workflow board isn't connected to a live data source yet."
      backHref="/editor"
      backLabel="Back to Editor"
    />
  );
}
