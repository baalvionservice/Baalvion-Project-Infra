import { buildMetadata } from "@/lib/seo";
import { topicMeta } from "@/lib/topic-config";
import { StocksHub } from "@/components/pages/StocksHub";

const SLUG = "stocks";

export const metadata = buildMetadata(topicMeta(SLUG));
export const dynamic = 'force-dynamic';

export default function Page() {
  return <StocksHub />;
}
