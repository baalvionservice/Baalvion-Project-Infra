import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { sitemapService } from "@/modules/seo/services/sitemap-service";

/**
 * On-publish revalidation webhook — near-real-time indexing.
 *
 * cms-service (or admin-platform) calls this after a content publish/update/delete:
 *
 *   POST /api/revalidate
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "paths": ["/banking", "/some-article-slug"], "urls": ["https://imperialpedia.com/..."] }
 *
 * It (1) drops the sitemap cache so the index + shards reflect the change, (2)
 * revalidates the affected Next.js routes, and (3) optionally pings IndexNow so
 * Bing/Yandex (and Google via the shared protocol) recrawl immediately.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret =
    req.headers.get("x-revalidate-secret") || url.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    paths?: string[];
    urls?: string[];
  };

  // 1) Always refresh the sitemap (new/removed URLs) + the high-churn hubs.
  sitemapService.invalidate();
  const defaults = ["/", "/news", "/articles", "/sitemap.xml"];
  const paths = Array.from(new Set([...(body.paths ?? []), ...defaults]));
  const revalidated: string[] = [];
  for (const p of paths) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch {
      /* ignore individual path failures */
    }
  }

  // 2) IndexNow ping (optional — no-op unless INDEXNOW_KEY is configured).
  let indexNow: "skipped" | "sent" | "error" = "skipped";
  const key = process.env.INDEXNOW_KEY;
  if (key && Array.isArray(body.urls) && body.urls.length) {
    try {
      const host = new URL(body.urls[0]).host;
      await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          key,
          keyLocation: `https://${host}/${key}.txt`,
          urlList: body.urls.slice(0, 10000),
        }),
      });
      indexNow = "sent";
    } catch {
      indexNow = "error";
    }
  }

  return NextResponse.json({ ok: true, revalidated, indexNow });
}
