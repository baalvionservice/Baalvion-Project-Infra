import { CategoryFeed } from "@/components/pages/CategoryFeed";
import { topicMeta } from "@/lib/topic-config";
import { buildMetadata } from "@/lib/seo";

const SLUG = "company-news";

export const metadata = buildMetadata(topicMeta(SLUG));

// Editorial content changes on publish — render LIVE per-request so the CMS
// is read on every request (works on Vercel against a public CMS).
export const dynamic = 'force-dynamic';

export default function Page() {
  return <CategoryFeed slug={SLUG} />;
}
