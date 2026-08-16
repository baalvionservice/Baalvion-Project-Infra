import { ArticleNotFound } from '@/components/knowledge/ArticleView';

/**
 * Segment-scoped not-found — gives a real 404 HTTP status (via notFound() in
 * page.tsx) while keeping the themed ArticleNotFound empty state. Mirrors
 * src/app/[categorySlug]/[articleSlug]/not-found.tsx.
 */
export default function LegacyArticleSlugNotFound() {
  return <ArticleNotFound />;
}
