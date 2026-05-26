import { env } from "@/config/env";

/**
 * @fileOverview Service for generating absolute canonical URLs for programmatic SEO.
 */

export type ContentType =
  | "article"
  | "glossary"
  | "tool"
  | "category"
  | "tag"
  | "topic";

export const canonicalService = {
  /**
   * Generates an absolute canonical URL for a given slug and content type.
   */
  generateCanonicalURL: (slug: string, type: ContentType): string => {
    const baseUrl = env.siteUrl.endsWith("/")
      ? env.siteUrl.slice(0, -1)
      : env.siteUrl;

    let path = "";
    switch (type) {
      case "article":
        path = `/articles/${slug}`;
        break;
      case "glossary":
        path = `/glossary/${slug}`;
        break;
      case "tool":
        path = `/calculators/${slug}`;
        break;
      case "category":
        path = `/categories/${slug}`;
        break;
      case "tag":
        path = `/tags/${slug}`;
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
  getCanonicalTag: (slug: string, type: ContentType): string => {
    return canonicalService.generateCanonicalURL(slug, type);
  },
};
