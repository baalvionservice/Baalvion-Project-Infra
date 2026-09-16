import {
  generateCategoryArticleMetadata,
  CategoryArticleSubpathPage,
} from "@/modules/content-engine/render/category-article-subpath";

// ISR: the route is prerendered on first hit and served from cache after
// that — LCP for a cached hit is the render time of a static file, not a
// live CMS round trip. `generateStaticParams` returning [] registers this as
// ISR with a blocking fallback (nothing prerendered at build time, first
// request per slug renders and caches it) rather than fully dynamic.
// `revalidate` is the safety net for a missed publish webhook, not the
// primary freshness mechanism — /api/revalidate calls revalidateTag() on
// every CMS publish/update, which purges the cache immediately regardless of
// this window.
export async function generateStaticParams(): Promise<Params[]> {
  return [];
}
export const revalidate = 1800; // 30 minutes

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  return generateCategoryArticleMetadata({ params });
}

export default async function Page({ params }: { params: Promise<Params> }) {
  return <CategoryArticleSubpathPage categorySlug="creator-economy" params={params} />;
}
