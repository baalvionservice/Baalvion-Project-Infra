/**
 * @fileOverview Licenses API — collection endpoint.
 *
 * GET  /api/licenses           → all publicly-visible licenses.
 * GET  /api/licenses?kind=...  → publicly-visible licenses of a single kind.
 *   `kind` must be one of the canonical LicenseKind values; anything else → 400.
 *
 * Write methods are authenticated admin/CMS scaffolds returning 501 once
 * authorized. License numbers / certificate documents are NEVER fabricated;
 * they are supplied only by management through the admin/CMS.
 */

import type { LicenseKind } from "@/lib/content/types";
import { getPublicLicenses, getLicensesByKind } from "@/lib/content/store";
import { ok, fail } from "@/lib/api/respond";
import { requireAdmin } from "@/lib/api/admin-guard";

export const runtime = "nodejs";

const NOT_IMPLEMENTED =
  "Admin write API not yet wired to persistence. See docs/PLATFORM_ARCHITECTURE.md.";

/** Canonical set of accepted `?kind=` values (mirrors the LicenseKind union). */
const LICENSE_KINDS: readonly LicenseKind[] = [
  "quarry-license",
  "mining-license",
  "environmental-clearance",
  "government-approval",
  "industry-registration",
  "corporate-registration",
  "iso-certification",
];

function isLicenseKind(value: string): value is LicenseKind {
  return (LICENSE_KINDS as readonly string[]).includes(value);
}

export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const kindParam = searchParams.get("kind");

    if (kindParam !== null) {
      if (!isLicenseKind(kindParam)) {
        return fail(
          `Invalid 'kind'. Expected one of: ${LICENSE_KINDS.join(", ")}.`,
          400,
        );
      }
      const licenses = await getLicensesByKind(kindParam);
      return ok(licenses);
    }

    const licenses = await getPublicLicenses();
    return ok(licenses);
  } catch {
    return fail("Unable to load licenses.", 500);
  }
}

/**
 * TODO(platform): admin/CMS write surface — CREATE a license/certification.
 * Intended contract: validate body (kind, title, authority, status, dates),
 * upload the genuine certificate document, set publiclyVisible flag. Never
 * auto-generate a license number.
 */
export async function POST(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}

/**
 * TODO(platform): admin/CMS write surface — UPDATE a license, including the
 * public visibility toggle and expiry renewal tracking.
 */
export async function PUT(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}

/**
 * TODO(platform): admin/CMS write surface — DELETE/archive a license by id.
 */
export async function DELETE(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return fail(NOT_IMPLEMENTED, 501);
}
