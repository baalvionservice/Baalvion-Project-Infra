/**
 * @fileOverview Quarry Sites API — collection endpoint.
 *
 * GET  /api/quarry  → published quarry sites and their operational profiles.
 *
 * Write methods are authenticated admin/CMS scaffolds returning 501 once
 * authorized. Production metrics (capacity, tonnage) are only ever supplied by
 * management — never invented.
 */

import { getQuarrySites } from "@/lib/content/store";
import { ok, fail } from "@/lib/api/respond";
import { requireAdmin } from "@/lib/api/admin-guard";

export const runtime = "nodejs";

const NOT_IMPLEMENTED =
  "Admin write API not yet wired to persistence. See docs/PLATFORM_ARCHITECTURE.md.";

export async function GET(): Promise<Response> {
  try {
    const sites = await getQuarrySites();
    return ok(sites);
  } catch {
    return fail("Unable to load quarry sites.", 500);
  }
}

/**
 * TODO(platform): admin/CMS write surface — CREATE a quarry site.
 * Intended contract: validate body (name, slug, materials, capabilities,
 * equipment, safety/environmental programs, gallery, status, seo), reject
 * duplicate slugs, support gallery/document image upload, default to draft.
 */
export async function POST(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}

/**
 * TODO(platform): admin/CMS write surface — UPDATE a quarry site and/or toggle
 * its publish status (draft/published/archived).
 */
export async function PUT(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}

/**
 * TODO(platform): admin/CMS write surface — DELETE/archive a quarry site by id.
 */
export async function DELETE(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}
