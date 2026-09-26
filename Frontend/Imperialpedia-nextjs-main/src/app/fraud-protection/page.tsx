import { CategoryFeed, categoryHasLiveContent } from "@/components/pages/CategoryFeed";
import { topicMeta } from "@/lib/topic-config";
import { buildMetadata } from "@/lib/seo";
import { Metadata } from "next";

const SLUG = "fraud-protection";

// Empty category hubs read to Google as exactly the thin/low-value content
// pattern that blocks AdSense approval (see GLOSSARY_LIVE in config/glossary.ts
// for the same call made for the glossary). noindex until this category has a
// real published article — flips back automatically once one exists, no
// redeploy needed. (This category has 5 real published articles as of
// 2026-09-04, so this is already indexing; the gate stays in place for the
// same reason every other category keeps it.)
export async function generateMetadata(): Promise<Metadata> {
  const hasContent = await categoryHasLiveContent(SLUG);
  return buildMetadata({ ...topicMeta(SLUG), noIndex: !hasContent });
}

// Topic hub — content is CMS articles only, same reasoning as budgeting-basics'
// page.tsx: ISR instead of force-dynamic, since /api/revalidate already
// revalidates this route on every CMS publish/update/delete.
export const revalidate = 3600;

export default function Page() {
  return <CategoryFeed slug={SLUG} />;
}
