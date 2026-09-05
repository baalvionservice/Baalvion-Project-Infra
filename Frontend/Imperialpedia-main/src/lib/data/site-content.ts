/**
 * Generic reader for admin-editable page content — the entities table in
 * imperialpedia-service (GET/POST /entities) already serves companies and
 * terms; this reuses the exact same table/API with new `type` values so
 * admins can create or edit financial-tool explainers, stock-list blurbs,
 * market-index notes, topic-hub intros, and /latest category copy from the
 * admin panel (Imperialpedia > Site Content) without a code change.
 *
 * Every page that calls this keeps its bundled static content as the
 * fallback — a record that doesn't exist yet, or a request that fails,
 * never breaks the page; it just means the page is showing its default
 * copy until an admin overrides it. Same resilience pattern as
 * getAssetDetail's Yahoo fallback and fetchTermsByLetter's static fallback.
 */

import { CMS_CACHE_TAG } from "@/lib/cache-tags";

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1"
    : "http://localhost:3004/api/v1");

export type SiteContentType =
  | "financial-tool"
  | "stock-list"
  | "market-index"
  | "topic-hub"
  | "latest-category";

const BASE_ENTITY_FIELDS = new Set([
  "id", "type", "name", "slug", "description", "category", "country",
  "industry", "image", "tags", "aliases", "created_at", "updated_at",
]);

// Admin-authored site copy — section intros, explainer blurbs, hub descriptions,
// edited by hand every few weeks. The previous 300s window was the revalidate
// floor for ~85 prerendered routes (every CategoryFeed hub, /latest/[category],
// /stocks/lists/[slug], /stocks/indexes/[slug], the financial-tools explainers),
// so all of them regenerated every 5 minutes to re-fetch copy that had not
// changed. Tagged so /api/revalidate busts it with the CMS content beside it.
const SITE_CONTENT_REVALIDATE_SECONDS = 86400;

/**
 * Fetches one admin-managed content record and returns only its type-specific
 * fields (T) — the entities API flattens `attributes` onto the top level
 * alongside base columns like `id`/`name`/`description`/`created_at`, which
 * callers don't want mixed into their content shape, so those are stripped.
 * Returns null on any failure or missing record — callers fall back to their
 * bundled default in that case, never render a broken/partial page.
 */
export async function getSiteContent<T extends Record<string, unknown>>(
  type: SiteContentType,
  slug: string,
): Promise<T | null> {
  try {
    const res = await fetch(`${IMP_API}/entities/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`, {
      next: { revalidate: SITE_CONTENT_REVALIDATE_SECONDS, tags: [CMS_CACHE_TAG] },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!data || typeof data !== "object") return null;
    const rest = Object.fromEntries(
      Object.entries(data as Record<string, unknown>).filter(([key]) => !BASE_ENTITY_FIELDS.has(key)),
    );
    return rest as T;
  } catch {
    return null;
  }
}
