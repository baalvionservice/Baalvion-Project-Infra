import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CMS_CACHE_TAG } from "@/lib/cache-tags";

/**
 * On-publish revalidation webhook — the counterpart to cms.ts's cached reads.
 *
 * cms-service POSTs here after a content publish / unpublish / live edit (see
 * Backend/services/knowledge/cms-service/service/revalidateService.js). It is
 * dispatched from a `REVALIDATE_WEBHOOKS` map keyed by website slug, so this
 * route only fires once that map contains an entry for this site:
 *
 *   REVALIDATE_WEBHOOKS={"amarise-maison-avenue":"https://<host>/api/revalidate"}
 *   REVALIDATE_SECRET=<same shared secret both sides hold>
 *
 * Until then the editorial reads simply age out on their own window instead.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret =
    req.headers.get("x-revalidate-secret") || url.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // One tag drops every cached CMS read at once, which is what an editor
  // actually wants: they changed a block of copy and expect it live, without
  // the caller having to know which of the site's pages render that block.
  revalidateTag(CMS_CACHE_TAG);

  return NextResponse.json({ ok: true, revalidated: [CMS_CACHE_TAG] });
}
