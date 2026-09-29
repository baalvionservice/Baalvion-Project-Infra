import { ArticleNotFound } from '@/components/knowledge/ArticleView';

/**
 * Segment-scoped not-found — gives a real 404 HTTP status (via notFound() in
 * page.tsx) while keeping the themed ArticleNotFound empty state.
 */
export default function ArticleSlugNotFound() {
  return <ArticleNotFound />;
}
