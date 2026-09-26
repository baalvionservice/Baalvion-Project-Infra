import { env } from "@/config/env";

/**
 * @fileOverview Service for generating absolute canonical URLs for programmatic SEO.
 */

export type ContentType =
  | "article"
  | "tool"
  | "topic";

export const canonicalService = {
  /**
   * Generates an absolute canonical URL for a given slug and content type.
   * `categorySlug` (article type only) puts the guide under its real CMS
   * category — e.g. `/bonds/how-bond-yields-work` — instead of the flat
   * `/financial-intelligence/` bucket; omit it only for rows with no category.
   */
  generateCanonicalURL: (slug: string, type: ContentType, categorySlug?: string): string => {
    const baseUrl = env.siteUrl.endsWith("/")
      ? env.siteUrl.slice(0, -1)
      : env.siteUrl;

    let path = "";
    switch (type) {
      case "article":
        path = categorySlug ? `/${categorySlug}/${slug}` : `/financial-intelligence/${slug}`;
        break;
      case "tool":
        path = `/calculators/${slug}`;
        break;
      case "topic":
        path = `/topics/${slug}`;
        break;
      default:
        path = slug.startsWith("/") ? slug : `/${slug}`;
    }

    return `${baseUrl}${path}`;
  },

  /**
   * Helper to return the canonical tag URL directly.
   */
  getCanonicalTag: (slug: string, type: ContentType, categorySlug?: string): string => {
    return canonicalService.generateCanonicalURL(slug, type, categorySlug);
  },
};
