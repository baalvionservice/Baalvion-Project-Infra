/**
 * @fileOverview Products API — single-resource endpoint.
 *
 * GET    /api/products/:slug   → one published product, or 404 if not found.
 * PUT    /api/products/:slug   → admin/CMS update scaffold (501 once authorized).
 * DELETE /api/products/:slug   → admin/CMS delete scaffold (501 once authorized).
 */

import { getProduct } from "@/lib/content/store";
import { ok, fail } from "@/lib/api/respond";
import { requireAdmin } from "@/lib/api/admin-guard";

export const runtime = "nodejs";

const NOT_IMPLEMENTED =
  "Admin write API not yet wired to persistence. See docs/PLATFORM_ARCHITECTURE.md.";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(
  _req: Request,
  ctx: RouteContext,
): Promise<Response> {
  try {
    const { slug } = await ctx.params;
    if (!slug) return fail("A product slug is required.", 400);

    const product = await getProduct(slug);
    if (!product) return fail("Product not found.", 404);

    return ok(product);
  } catch {
    return fail("Unable to load product.", 500);
  }
}

/**
 * TODO(platform): admin/CMS write surface — UPDATE this product by slug.
 * Intended contract: validate body, support publish/visibility toggle and
 * datasheet/document upload, persist immutably (new revision over mutate).
 */
export async function PUT(req: Request, _ctx: RouteContext): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}

/**
 * TODO(platform): admin/CMS write surface — DELETE/archive this product by slug.
 * Prefer soft-delete (status → archived) to preserve history.
 */
export async function DELETE(
  req: Request,
  _ctx: RouteContext,
): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}
