import type { Metadata } from 'next';
import { fetchArticleForMetadata } from '@/lib/article-metadata-fetch';
import { buildArticleMetadata, ArticleJsonLd } from '@/lib/seo/article-seo';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const a = await fetchArticleForMetadata(slug);
  return buildArticleMetadata(a, slug, SITE);
}

export default async function ArticleLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const a = await fetchArticleForMetadata(slug);
  return (
    <>
      <ArticleJsonLd article={a} slug={slug} site={SITE} />
      {children}
    </>
  );
}
