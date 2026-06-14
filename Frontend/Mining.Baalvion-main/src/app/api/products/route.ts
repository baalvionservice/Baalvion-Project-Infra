/**
 * @fileOverview Products API — collection endpoint.
 *
 * GET  /api/products
 *   Returns published products plus published product categories so a catalog
 *   page can render both in one round-trip:
 *     { success: true, data: { products, categories } }
 *
 * Write methods (POST/PUT/DELETE) are authenticated admin/CMS scaffolds that
 * are not yet wired to persistence — they return 501 once authorized.
 */

import { getProducts, getProductCategories } from "@/lib/content/store";
import { ok, fail } from "@/lib/api/respond";
import { requireAdmin } from "@/lib/api/admin-guard";

export const runtime = "nodejs";

const NOT_IMPLEMENTED =
  "Admin write API not yet wired to persistence. See docs/PLATFORM_ARCHITECTURE.md.";

export async function GET(): Promise<Response> {
  try {
    const [products, categories] = await Promise.all([
      getProducts(),
      getProductCategories(),
    ]);
    return ok({ products, categories });
  } catch {
    return fail("Unable to load products.", 500);
  }
}

/**
 * TODO(platform): admin/CMS write surface — CREATE a product.
 * Intended contract once persistence is wired:
 *   - Validate body against the Product schema (name, slug, categoryId,
 *     specifications, applications, gallery, status, seo…).
 *   - Reject duplicate slugs.
 *   - Persist as draft by default; publish/visibility handled via PUT.
 *   - Support datasheet/document upload (multipart or pre-signed URL flow).
 */
export async function POST(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}

/**
 * TODO(platform): admin/CMS write surface — UPDATE a product and/or toggle its
 * publish status (draft/published/archived). Same validation as POST plus an id.
 */
export async function PUT(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}

/**
 * TODO(platform): admin/CMS write surface — DELETE (or archive) a product by id.
 * Prefer soft-delete (status → archived) to preserve history.
 */
export async function DELETE(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}
