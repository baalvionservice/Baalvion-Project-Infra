/**
 * @fileOverview Type definitions for the Programmatic SEO Engine.
 */

export interface SEOPageData {
  title: string;
  description: string;
  slug: string;
  keywords?: string[];
  image?: string;
  type?: 'article' | 'website' | 'tool' | 'glossary';
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
}

export interface BreadcrumbItem {
  name: string;
  item: string;
  position?: number;
}

export interface Breadcrumb {
  items: BreadcrumbItem[];
}
