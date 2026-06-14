/**
 * @fileOverview Projects API — collection endpoint.
 *
 * GET  /api/projects  → published projects.
 *
 * Write methods are authenticated admin/CMS scaffolds returning 501 once
 * authorized.
 */

import { getProjects } from "@/lib/content/store";
import { ok, fail } from "@/lib/api/respond";
import { requireAdmin } from "@/lib/api/admin-guard";

export const runtime = "nodejs";

const NOT_IMPLEMENTED =
  "Admin write API not yet wired to persistence. See docs/PLATFORM_ARCHITECTURE.md.";

export async function GET(): Promise<Response> {
  try {
    const projects = await getProjects();
    return ok(projects);
  } catch {
    return fail("Unable to load projects.", 500);
  }
}

/**
 * TODO(platform): admin/CMS write surface — CREATE a project.
 * Intended contract: validate body (name, slug, category, summary, stage,
 * gallery, status, seo), reject duplicate slugs, support gallery image upload,
 * default to draft; publish handled via PUT.
 */
export async function POST(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}

/**
 * TODO(platform): admin/CMS write surface — UPDATE a project and/or toggle its
 * publish status (draft/published/archived) and stage.
 */
export async function PUT(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}

/**
 * TODO(platform): admin/CMS write surface — DELETE/archive a project by id.
 */
export async function DELETE(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}
