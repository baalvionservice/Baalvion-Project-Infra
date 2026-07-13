import { InvestingHub } from "@/components/pages/InvestingHub";
import { topicMeta } from "@/lib/topic-config";
import { buildMetadata } from "@/lib/seo";

const SLUG = "investing";

export const metadata = buildMetadata(topicMeta(SLUG));

// Editorial content changes on publish — render LIVE per-request so the CMS
// is read on every request (works on Vercel against a public CMS).
export const dynamic = 'force-dynamic';

export default function Page() {
  return <InvestingHub />;
}
