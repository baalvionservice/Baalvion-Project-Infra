import { ID, Slug } from '@/types/common';

/**
 * @fileOverview Type definitions for Tags within the Content Engine.
 */

export interface Tag {
  id: ID;
  slug: Slug;
  name: string;
  description?: string;
  articleCount: number;

  // SEO Metadata
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}
