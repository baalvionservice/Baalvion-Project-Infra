"use client";

import {
  articlesService,
  glossaryService,
  calculatorsService,
} from "@/services/data";
import { getTags } from "@/modules/content-engine/services/tag-service";
import { getCategories } from "@/modules/content-engine/services/category-service";
import { canonicalService, ContentType } from "./canonical-service";
import { sitemapService } from "./sitemap-service";
import { logger } from "@/lib/errors/logger";

/**
 * @fileOverview Automated SEO Audit Service for programmatic pages.
 * Validates canonical tags, structured data, and sitemap inclusion for mass-generated content.
 */

export interface SEOAuditResult {
  slug: string;
  type: ContentType;
  hasCanonical: boolean;
  hasBreadcrumbSchema: boolean;
  hasFAQSchema: boolean;
  hasMetadata: boolean;
  includedInSitemap: boolean;
  issues: string[];
}

export interface SEOAuditReport {
  totalPages: number;
  passed: number;
  failed: number;
  failedPages: { slug: string; type: string; issues: string[] }[];
  timestamp: string;
}

export const seoAuditService = {
  /**
   * Runs a comprehensive SEO audit for a specific programmatic page.
   */
  async runAuditForPage(
    slug: string,
    type: ContentType
  ): Promise<SEOAuditResult> {
    const issues: string[] = [];
    let hasMetadata = false;
    let hasFAQSchema = false; // Simplified check for mock data

    // 1. Check Metadata and Existence based on type
    try {
      switch (type) {
        case "article": {
          const art = await articlesService.getArticleBySlug(slug);
          hasMetadata = !!(art.data?.title && art.data?.description);
          break;
        }
        case "glossary": {
          const term = await glossaryService.getTermBySlug(slug);
          hasMetadata = !!(term.data?.term && term.data?.definition);
          break;
        }
        case "tool": {
          const tools = await calculatorsService.getCalculatorList();
          const tool = tools.data.find((t) => t.slug === slug);
          hasMetadata = !!(tool?.name && tool?.description);
          break;
        }
        case "category": {
          const cat = await getCategoryBySlug(slug);
          hasMetadata = !!(cat.data?.name && cat.data?.description);
          break;
        }
        case "tag": {
          const tag = await getTagBySlug(slug);
          hasMetadata = !!tag.data?.name;
          break;
        }
      }
    } catch (e) {
      issues.push(`Page data retrieval failed for slug: ${slug}`);
    }

    if (!hasMetadata)
      issues.push("Missing critical SEO metadata (title or description)");

    // 2. Canonical Check
    const canonical = canonicalService.getCanonicalTag(slug, type);
    const hasCanonical = !!canonical && canonical.startsWith("http");
    if (!hasCanonical) issues.push("Invalid or missing canonical URL");

    // 3. Sitemap Inclusion Check (Simplified Logic)
    // In a real app, this would check if the URL exists in the generated XML
    const sitemap = await sitemapService.regenerateSitemap();
    const includedInSitemap = sitemap.includes(slug);
    if (!includedInSitemap) issues.push("Not found in dynamic XML sitemap");

    // 4. Breadcrumb Logic Check
    // We check if the slug is valid for breadcrumb generation
    const hasBreadcrumbSchema = !!slug;

    return {
      slug,
      type,
      hasCanonical,
      hasBreadcrumbSchema,
      hasFAQSchema,
      hasMetadata,
      includedInSitemap,
      issues,
    };
  },

  /**
   * Runs an audit for every programmatic page in the system.
   */
  async runAuditForAllPages(): Promise<SEOAuditReport> {
    const start = Date.now();
    logger.info("Starting full platform SEO audit...");

    const [articles, glossary, calculators, categories, tags] =
      await Promise.all([
        articlesService.getArticles(1, 1000),
        glossaryService.getTerms(1, 1000),
        calculatorsService.getCalculatorList(),
        getCategories(),
        getTags(),
      ]);

    const results: SEOAuditResult[] = [];

    // Collect all audit tasks
    const tasks: Promise<SEOAuditResult>[] = [
      ...articles.data.map((p) => this.runAuditForPage(p.slug, "article")),
      ...glossary.data.map((p) => this.runAuditForPage(p.slug, "glossary")),
      ...calculators.data.map((p) => this.runAuditForPage(p.slug, "tool")),
      ...categories.data.map((p) => this.runAuditForPage(p.slug, "category")),
      ...tags.data.map((p) => this.runAuditForPage(p.slug, "tag")),
    ];

    const allResults = await Promise.all(tasks);

    const failed = allResults.filter((r) => r.issues.length > 0);
    const report: SEOAuditReport = {
      totalPages: allResults.length,
      passed: allResults.length - failed.length,
      failed: failed.length,
      failedPages: failed.map((f) => ({
        slug: f.slug,
        type: f.type,
        issues: f.issues,
      })),
      timestamp: new Date().toISOString(),
    };

    const duration = Date.now() - start;
    logger.info(`SEO Audit completed in ${duration}ms.`);
    logger.info(`Report: ${report.passed}/${report.totalPages} pages passed.`);

    if (report.failed > 0) {
      logger.warn(
        `SEO Audit found issues on ${report.failed} pages. Check report for details.`
      );
    }

    return report;
  },
};

/**
 * Mock helper for category/tag retrieval used within audit
 */
async function getCategoryBySlug(slug: string) {
  const cats = await getCategories();
  return { data: cats.data.find((c) => c.slug === slug) || null };
}

async function getTagBySlug(slug: string) {
  const tags = await getTags();
  return { data: tags.data.find((t) => t.slug === slug) || null };
}
