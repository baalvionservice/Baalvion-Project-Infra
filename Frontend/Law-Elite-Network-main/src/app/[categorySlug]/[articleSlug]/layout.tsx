import type { Metadata } from 'next';
import { fetchArticleForMetadata } from '@/lib/article-metadata-fetch';
import { buildArticleMetadata, ArticleJsonLd } from '@/lib/seo/article-seo';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export async function generateMetadata(
  { params }: { params: Promise<{ categorySlug: string; articleSlug: string }> },
): Promise<Metadata> {
  const { articleSlug } = await params;
  const a = await fetchArticleForMetadata(articleSlug);
  return buildArticleMetadata(a, articleSlug, SITE);
}

export default async function ArticleLayout(
  { children, params }: {
    children: React.ReactNode;
    params: Promise<{ categorySlug: string; articleSlug: string }>;
  },
) {
  const { articleSlug } = await params;
  const a = await fetchArticleForMetadata(articleSlug);
  return (
    <>
      <ArticleJsonLd article={a} slug={articleSlug} site={SITE} />
      {children}
    </>
  );
}
