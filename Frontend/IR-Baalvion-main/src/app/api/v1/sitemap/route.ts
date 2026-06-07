import { NextResponse } from "next/server";
import { cmsListPages } from "@/lib/cms";
import { SEED_PAGES } from "@/lib/cms-seed";

// Sitemap data (server-safe). The page/content/board services are `'use client'` and cannot run
// in this server route, so we read pages from the server-safe CMS client (with seed fallback).
// News/document detail routes are not per-slug pages, so they are not emitted here.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let pages: Array<Record<string, any>> = [];
    try {
      const cmsPages = await cmsListPages();
      pages = cmsPages.length > 0 ? cmsPages : SEED_PAGES;
    } catch {
      pages = SEED_PAGES;
    }

    const publishedPages = pages.filter(
      (page) => page.status === "Published" && page.workflowStatus === "Published"
    );

    const sitemapData = {
      pages: publishedPages.map((page) => ({
        slug: page.slug,
        lastModified:
          Array.isArray(page.versionHistory) && page.versionHistory.length > 0
            ? page.versionHistory[page.versionHistory.length - 1].timestamp
            : new Date().toISOString(),
        priority: page.slug === "/" ? 1.0 : 0.7,
      })),
      news: [],
      documents: [],
      boardMaterials: [],
      lastGenerated: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: sitemapData });
  } catch (error) {
    console.error("Error generating sitemap data:", error);
    return NextResponse.json(
      { success: true, data: { pages: [], news: [], documents: [], boardMaterials: [], lastGenerated: new Date().toISOString() } },
    );
  }
}
