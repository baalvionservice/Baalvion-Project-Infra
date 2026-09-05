import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import {
  resolveArticleForDetail,
  buildArticleDetailMetadata,
  ArticleDetailContent,
} from "@/modules/content-engine/render/article-detail";

interface ArticleRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticleRouteProps): Promise<Metadata> {
  const { slug } = await params;
  return buildArticleDetailMetadata(slug);
}

/**
 * Empty on purpose — see the same export on the root [...slug] route. Without
 * it Next renders this route from scratch on every request instead of caching
 * it; with it, nothing is prerendered at build but on-demand renders are.
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

export const revalidate = 86400;

/**
 * A categorized guide's canonical home is `/<categorySlug>/<slug>` (e.g.
 * `/bonds/how-bond-yields-work`), not this flat bucket — redirect there
 * instead of serving a second indexable copy at this URL. Only uncategorized
 * rows (no CMS category assigned) render here directly, since there is no
 * category-prefixed URL to send them to.
 */
export default async function Page({ params }: ArticleRouteProps) {
  const { slug } = await params;
  const article = await resolveArticleForDetail(slug);
  if (!article) notFound();

  if (article.categorySlug) {
    permanentRedirect(`/${article.categorySlug}/${slug}`);
  }

  return <ArticleDetailContent article={article} />;
}
