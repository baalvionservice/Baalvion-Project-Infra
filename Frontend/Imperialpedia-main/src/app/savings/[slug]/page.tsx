import {
  generateCategoryArticleMetadata,
  CategoryArticleSubpathPage,
} from "@/modules/content-engine/render/category-article-subpath";

// ISR: see the creator-economy category's page.tsx for the full rationale —
// same pattern, verified live in production (real LCP 12s -> 2.3s). A new
// article needs zero code changes to benefit: the first real visit renders
// and caches it, and /api/revalidate purges instantly on publish.
export async function generateStaticParams(): Promise<Params[]> {
  return [];
}
export const revalidate = 1800; // 30 minutes

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  return generateCategoryArticleMetadata({ params });
}

export default async function Page({ params }: { params: Promise<Params> }) {
  return <CategoryArticleSubpathPage categorySlug="savings" params={params} />;
}
