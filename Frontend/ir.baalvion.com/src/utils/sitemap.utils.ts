import { MetadataRoute } from "next";

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority: number;
}

/**
 * Utility functions for sitemap generation and SEO optimization
 */
export const sitemapUtils = {
  /**
   * Remove duplicate URLs from sitemap entries
   */
  removeDuplicates: (entries: SitemapEntry[]): SitemapEntry[] => {
    const seen = new Set<string>();
    return entries.filter((entry) => {
      if (seen.has(entry.url)) {
        return false;
      }
      seen.add(entry.url);
      return true;
    });
  },

  /**
   * Sort sitemap entries by priority (highest first) and then by last modified date
   */
  sortEntries: (entries: SitemapEntry[]): SitemapEntry[] => {
    return entries.sort((a, b) => {
      // First sort by priority (descending)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Then by last modified date (most recent first)
      return b.lastModified.getTime() - a.lastModified.getTime();
    });
  },

  /**
   * Validate sitemap entry
   */
  validateEntry: (entry: SitemapEntry): boolean => {
    // Check if URL is valid
    try {
      new URL(entry.url);
    } catch {
      return false;
    }

    // Check priority range
    if (entry.priority < 0 || entry.priority > 1) {
      return false;
    }

    // Check if lastModified is a valid date
    if (
      !(entry.lastModified instanceof Date) ||
      isNaN(entry.lastModified.getTime())
    ) {
      return false;
    }

    return true;
  },

  /**
   * Filter and clean sitemap entries
   */
  cleanEntries: (entries: SitemapEntry[]): SitemapEntry[] => {
    return entries
      .filter(sitemapUtils.validateEntry)
      .filter((entry) => !entry.url.includes("#")) // Remove anchor links
      .filter((entry) => !entry.url.includes("?")) // Remove query parameters
      .map((entry) => ({
        ...entry,
        url: entry.url.replace(/\/$/, "") || entry.url, // Remove trailing slash except for root
      }));
  },

  /**
   * Generate change frequency based on content type and age
   */
  getChangeFrequency: (
    contentType: "homepage" | "news" | "document" | "governance" | "static",
    lastModified: Date
  ): SitemapEntry["changeFrequency"] => {
    const daysSinceModified = Math.floor(
      (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24)
    );

    switch (contentType) {
      case "homepage":
        return "daily";
      case "news":
        return daysSinceModified < 30 ? "weekly" : "monthly";
      case "document":
        return "monthly";
      case "governance":
        return "yearly";
      case "static":
      default:
        return "monthly";
    }
  },

  /**
   * Generate priority based on content type and importance
   */
  getPriority: (
    contentType: "homepage" | "news" | "document" | "governance" | "static",
    isRecent: boolean = false
  ): number => {
    const basePriority = {
      homepage: 1.0,
      news: 0.8,
      document: 0.7,
      governance: 0.6,
      static: 0.5,
    }[contentType];

    // Boost priority for recent content
    return isRecent ? Math.min(basePriority + 0.1, 1.0) : basePriority;
  },

  /**
   * Create a sitemap entry with smart defaults
   */
  createEntry: (
    url: string,
    contentType: "homepage" | "news" | "document" | "governance" | "static",
    lastModified?: Date,
    customPriority?: number
  ): SitemapEntry => {
    const modifiedDate = lastModified || new Date();
    const isRecent =
      Date.now() - modifiedDate.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days

    return {
      url,
      lastModified: modifiedDate,
      changeFrequency: sitemapUtils.getChangeFrequency(
        contentType,
        modifiedDate
      ),
      priority:
        customPriority || sitemapUtils.getPriority(contentType, isRecent),
    };
  },

  /**
   * Process and optimize a complete sitemap
   */
  processSitemap: (entries: SitemapEntry[]): MetadataRoute.Sitemap => {
    return sitemapUtils.sortEntries(
      sitemapUtils.removeDuplicates(sitemapUtils.cleanEntries(entries))
    );
  },
};
