import { LatestNewsPage } from "./components/LatestNewsPage";
import { buildMetadata } from "@/lib/seo";

export default function LatestPage() {
  return <LatestNewsPage />;
}

// A bare object here (no `alternates.canonical`) previously inherited the
// root layout's default canonical (the homepage), making every visit to
// /latest report as a duplicate of "/" in Search Console. buildMetadata
// self-canonicalizes it instead.
export const metadata = buildMetadata({
  canonical: "/latest",
  title: "Latest News - Stay Updated",
  description:
    "Get the latest financial and business news with real-time updates",
});
