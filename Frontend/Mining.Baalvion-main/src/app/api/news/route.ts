/**
 * @fileOverview News API — collection + single endpoint.
 *
 * GET  /api/news            → all published news articles.
 * GET  /api/news?slug=...   → one published article, or 404 if not found.
 *
 * Write methods are authenticated admin/CMS scaffolds returning 501 once
 * authorized.
 */

import { getNews, getNewsArticle } from "@/lib/content/store";
import { ok, fail } from "@/lib/api/respond";
import { requireAdmin } from "@/lib/api/admin-guard";

export const runtime = "nodejs";

const NOT_IMPLEMENTED =
  "Admin write API not yet wired to persistence. See docs/PLATFORM_ARCHITECTURE.md.";

export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug !== null) {
      if (slug.trim().length === 0) {
        return fail("A non-empty 'slug' is required.", 400);
      }
      const article = await getNewsArticle(slug);
      if (!article) return fail("News article not found.", 404);
      return ok(article);
    }

    const news = await getNews();
    return ok(news);
  } catch {
    return fail("Unable to load news.", 500);
  }
}

/**
 * TODO(platform): admin/CMS write surface — CREATE a news article.
 * Intended contract: validate body (title, slug, excerpt, body, coverImage,
 * publishedOn, status, seo), reject duplicate slugs, support cover-image
 * upload, default to draft; publish handled via PUT.
 */
export async function POST(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}

/**
 * TODO(platform): admin/CMS write surface — UPDATE an article and/or toggle its
 * publish status (draft/published/archived).
 */
export async function PUT(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}

/**
 * TODO(platform): admin/CMS write surface — DELETE/archive an article by id.
 */
export async function DELETE(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}
