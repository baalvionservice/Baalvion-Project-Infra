import { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata-builder';
import { structuredData } from '@/lib/seo/structured-data';
import { SEOPageData, BreadcrumbItem } from '../types';
import { canonicalService, ContentType } from '@/modules/seo/services/canonical-service';

/**
 * @fileOverview Core service for Programmatic SEO logic.
 * Orchestrates metadata generation and structured data for high-scale pages.
 */

export const seoService = {
  /**
   * Generates a URL-friendly slug from a string.
   */
  generateSlug: (text: string): string => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w-]+/g, '')  // Remove all non-word chars
      .replace(/--+/g, '-')     // Replace multiple - with single -
      .replace(/^-+/, '')       // Trim - from start of text
      .replace(/-+$/, '');      // Trim - from end of text
  },

  /**
   * Generates dynamic Next.js Metadata for programmatic pages.
   */
  generateMetadata: (data: SEOPageData, pathPrefix: string): Metadata => {
    // Determine content type for canonical generation
    let contentType: ContentType = 'article';
    if (pathPrefix.includes('glossary')) contentType = 'glossary';
    if (pathPrefix.includes('calculators')) contentType = 'tool';
    if (pathPrefix.includes('categories')) contentType = 'category';
    if (pathPrefix.includes('tags')) contentType = 'tag';
    if (pathPrefix.includes('topics')) contentType = 'topic';

    const canonical = canonicalService.getCanonicalTag(data.slug, contentType);

    return buildMetadata({
      title: data.title,
      description: data.description,
      keywords: data.keywords,
      canonical: canonical,
      ogImage: data.image,
      ogType: data.type === 'article' ? 'article' : 'website',
    });
  },

  /**
   * Generates JSON-LD Structured Data for search engines.
   */
  generateStructuredData: (data: SEOPageData, type: 'article' | 'glossary' | 'tool' | 'breadcrumb' | 'breadcrumb-list', items?: BreadcrumbItem[]) => {
    switch (type) {
      case 'article':
        return structuredData.article({
          title: data.title,
          description: data.description,
          image: data.image || '',
          authorName: data.author || 'Imperialpedia Expert',
          datePublished: data.publishedAt || new Date().toISOString(),
          dateModified: data.updatedAt,
        });
      
      case 'breadcrumb-list':
        if (!items) return null;
        return structuredData.breadcrumb(items);

      default:
        return structuredData.organization();
    }
  },

  /**
   * Helper to create breadcrumb items.
   */
  buildBreadcrumbs: (items: BreadcrumbItem[]) => {
    return structuredData.breadcrumb(items);
  }
};
