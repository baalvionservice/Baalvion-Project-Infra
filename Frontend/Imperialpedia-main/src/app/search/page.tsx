import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata-builder";
import { SearchPageClient } from "./SearchPageClient";
import { getArticles } from "@/modules/content-engine/services/content-service";

// Internal site search results are infinite, near-duplicate URL space
// (`?q=` accepts anything) — Google explicitly recommends `noindex` for this
// pattern rather than letting every query string get crawled and indexed as
// thin content. The page still resolves and is followable (not `nofollow`),
// and self-canonicalizes to the bare `/search` so any stray indexing that
// does happen consolidates onto one URL instead of fragmenting across queries.
export async function generateMetadata(): Promise<Metadata> {
  const metadata = buildMetadata({
    title: "Search",
    description: "Search Imperialpedia's knowledge graph — companies, countries, industries, technologies, markets, and articles.",
    canonical: "/search",
    noIndex: true,
  });
  // `buildMetadata(noIndex: true)` sets both index and follow to false. Google's own
  // guidance for internal search-results pages is `noindex, follow` — keep link equity
  // flowing to the pages this page links out to, just don't index the results page itself.
  return {
    ...metadata,
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true, 'max-image-preview': 'large' },
    },
  };
}

export default async function SearchPage() {
  // Real, CMS-backed articles (same source as the homepage's "Latest Articles"
  // rail) — surfaced when a search has no query yet or returns nothing, so a
  // visitor always has somewhere useful to go instead of a dead end.
  const { data: trendingArticles } = await getArticles(1, 6);
  return <SearchPageClient trendingArticles={trendingArticles} />;
}
