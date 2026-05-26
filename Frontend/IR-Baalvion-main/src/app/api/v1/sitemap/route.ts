import { NextRequest, NextResponse } from "next/server";
import { contentService } from "@/core/services/content.service";
import { pageService } from "@/core/services/page.service";
import { boardMaterialsService } from "@/core/services/board-materials.service";

export async function GET(request: NextRequest) {
  try {
    // Get all dynamic content for sitemap
    const [contentData, pagesResponse, boardMaterials] = await Promise.all([
      contentService.getAllContentForSitemap(),
      pageService.getAllPages(),
      boardMaterialsService.getMaterials(),
    ]);

    const publishedPages =
      pagesResponse.success && pagesResponse.data
        ? pagesResponse.data.filter(
            (page) =>
              page.status === "Published" && page.workflowStatus === "Published"
          )
        : [];

    const publishedMaterials = boardMaterials.filter(
      (material) => material.workflowStatus === "Published"
    );

    const sitemapData = {
      pages: publishedPages.map((page) => ({
        slug: page.slug,
        lastModified:
          page.versionHistory.length > 0
            ? page.versionHistory[page.versionHistory.length - 1].timestamp
            : new Date().toISOString(),
        priority: page.slug === "/" ? 1.0 : 0.7,
      })),
      news: contentData.news.map((article) => ({
        slug: article.slug,
        category: article.category,
        lastModified: article.lastModified,
        priority: article.priority || 0.7,
      })),
      documents: contentData.documents.map((doc) => ({
        slug: doc.slug,
        type: doc.type,
        lastModified: doc.lastModified,
        priority: doc.type === "annual-report" ? 0.9 : 0.8,
      })),
      boardMaterials: publishedMaterials.map((material) => ({
        id: material.id,
        lastModified:
          material.versionHistory.length > 0
            ? material.versionHistory[material.versionHistory.length - 1]
                .timestamp
            : new Date().toISOString(),
        priority: 0.5,
      })),
      lastGenerated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: sitemapData,
    });
  } catch (error) {
    console.error("Error generating sitemap data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate sitemap data",
      },
      { status: 500 }
    );
  }
}
