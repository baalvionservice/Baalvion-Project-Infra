import { ID, Slug } from '@/types/common';

/**
 * @fileOverview Type definitions for Categories within the Content Engine.
 */

export interface Category {
  id: ID;
  slug: Slug;
  name: string;
  description: string;
  icon?: string;
  parentCategory?: ID;
  articleCount: number;
  
  // SEO Metadata
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}
