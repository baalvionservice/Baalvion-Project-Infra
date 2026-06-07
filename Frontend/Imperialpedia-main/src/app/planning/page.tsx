import { CategoryFeed } from "@/components/pages/CategoryFeed";
import { topicMeta } from "@/lib/topic-config";
import { buildMetadata } from "@/lib/seo";

const SLUG = "planning";

export const metadata = buildMetadata(topicMeta(SLUG));

// Editorial content changes on publish — render dynamically, revalidate often.
export const revalidate = 120;

export default function Page() {
  return <CategoryFeed slug={SLUG} />;
}
