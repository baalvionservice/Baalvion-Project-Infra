import { CategoryFeed, categoryHasLiveContent } from "@/components/pages/CategoryFeed";
import { topicMeta } from "@/lib/topic-config";
import { buildMetadata } from "@/lib/seo";
import { Metadata } from "next";

const SLUG = "planning";

export async function generateMetadata(): Promise<Metadata> {
  const hasContent = await categoryHasLiveContent(SLUG);
  return buildMetadata({ ...topicMeta(SLUG), noIndex: !hasContent });
}

export const revalidate = 3600;

export default function Page() {
  return <CategoryFeed slug={SLUG} />;
}
