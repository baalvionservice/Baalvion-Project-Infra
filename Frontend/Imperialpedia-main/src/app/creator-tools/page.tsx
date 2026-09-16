import { CategoryFeed, categoryHasLiveContent } from "@/components/pages/CategoryFeed";
import { topicMeta } from "@/lib/topic-config";
import { buildMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { CreatorEarningsCalculator } from "@/components/creator/CreatorEarningsCalculator";
import { Container } from "@/design-system/layout/container";

const SLUG = "creator-tools";

export async function generateMetadata(): Promise<Metadata> {
  const hasContent = await categoryHasLiveContent(SLUG);
  return buildMetadata({ ...topicMeta(SLUG), noIndex: false });
}

export const revalidate = 3600;

export default function Page() {
  return (
    <div className="space-y-12">
      <CategoryFeed slug={SLUG} />
      <Container className="pb-16">
        <div className="border-t border-gray-200 dark:border-gray-800 pt-12">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Featured Interactive Tool: YouTube & Creator Earnings Calculator
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Estimate your monthly ad revenue, RPMs, and brand deal rates dynamically.
            </p>
          </div>
          <CreatorEarningsCalculator />
        </div>
      </Container>
    </div>
  );
}
