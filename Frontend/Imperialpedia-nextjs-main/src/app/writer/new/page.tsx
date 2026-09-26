import { FeatureUnavailable } from "@/components/system/FeatureUnavailable";

/**
 * Was rendering ArticleEditor, whose "Submit for Review"/"Save Draft" only ran
 * a setTimeout and showed a success toast — no API call, nothing ever saved
 * or submitted. Removed entirely rather than fixed in place, per the site's
 * real-data-first policy — see the mock-data remediation report and
 * FeatureUnavailable's doc comment.
 */
export default function NewArticlePage() {
  return (
    <FeatureUnavailable
      title="Article Editor"
      reason="The writer article editor isn't connected to a live publishing pipeline yet."
      backHref="/"
      backLabel="Back to Imperialpedia"
    />
  );
}
