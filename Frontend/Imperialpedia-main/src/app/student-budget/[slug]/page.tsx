import {
  generateCategoryArticleMetadata,
  CategoryArticleSubpathPage,
} from "@/modules/content-engine/render/category-article-subpath";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  return generateCategoryArticleMetadata({ params });
}

export default async function Page({ params }: { params: Promise<Params> }) {
  return CategoryArticleSubpathPage({ categorySlug: "student-budget", params });
}
