import {
  generateCategoryArticleMetadata,
  CategoryArticleSubpathPage,
} from "@/modules/content-engine/render/category-article-subpath";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  return generateCategoryArticleMetadata({ params });
}

export default async function Page({ params }: { params: Promise<Params> }) {
  return CategoryArticleSubpathPage({ categorySlug: "gdp", params });
}
