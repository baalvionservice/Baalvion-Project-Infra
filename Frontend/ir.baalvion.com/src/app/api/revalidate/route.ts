import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-publish revalidation webhook.
 *
 * cms-service POSTs here after a content publish / unpublish / live edit so the
 * affected investor-relations pages refresh immediately:
 *
 *   POST /api/revalidate
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "paths": ["/news/some-slug"], "urls": ["https://ir.baalvion.com/..."] }
 */
const DEFAULT_PATHS = ["/", "/news", "/press", "/leadership", "/sitemap.xml"];

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

  const paths = Array.from(new Set([...(body.paths ?? []), ...DEFAULT_PATHS]));
  const revalidated: string[] = [];
  for (const p of paths) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch {
      /* ignore individual path failures */
    }
  }

  // Optional IndexNow ping (no-op unless INDEXNOW_KEY is configured).
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
