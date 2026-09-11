import { CategoryFeed, categoryHasLiveContent } from "@/components/pages/CategoryFeed";
import { topicMeta } from "@/lib/topic-config";
import { buildMetadata } from "@/lib/seo";
import { Metadata } from "next";

const SLUG = "creator-economy";

// noindex until this category has a real published article — flips back
// automatically once one exists in the CMS, no redeploy needed.
export async function generateMetadata(): Promise<Metadata> {
  const hasContent = await categoryHasLiveContent(SLUG);
  return buildMetadata({ ...topicMeta(SLUG), noIndex: !hasContent });
}

// ISR — webhook at /api/revalidate revalidates this route on every CMS
// publish/update/delete, so force-dynamic is not needed.
export const revalidate = 3600;

export default function Page() {
  return <CategoryFeed slug={SLUG} />;
}
