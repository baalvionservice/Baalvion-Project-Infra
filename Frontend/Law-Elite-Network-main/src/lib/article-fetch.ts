import seedData from '../../docs/seed-data.json';
import { getArticleBySlug } from '@/data/law-content';
import { cmsGetArticleBySlug, cmsGetPreviewContent } from '@/lib/cms';
import { articlesPublicApi } from '@/lib/api/client';

/**
 * Source-of-truth order for the rendered article: CMS (preview-aware) ->
 * law-service -> bundled editorial library -> static seed. Shared by both the
 * canonical nested route (/law/[categorySlug]/[subSlug]/[articleSlug]) and the
 * legacy flat route (/article/[slug]) so the two never drift.
 */
export async function fetchArticleForRender(
  slug: string,
  previewToken?: string,
  previewExp?: string,
): Promise<any | null> {
  if (previewToken && previewExp) {
    const preview = await cmsGetPreviewContent(slug, previewExp, previewToken);
    if (preview) return preview;
  }

  const cms = await cmsGetArticleBySlug(slug);
  if (cms) return cms;

  try {
    const res = await articlesPublicApi.get(slug);
    if (res.data?.data) return res.data.data;
  } catch {
    /* ignore, fall through to bundled/seed */
  }

  const bundled = getArticleBySlug(slug);
  if (bundled) return bundled;

  const seedMatch = (seedData as any).articles?.find((a: any) => a.slug === slug && a.content);
  return seedMatch ? { ...seedMatch, updatedAt: 'February 12, 2025' } : null;
}
