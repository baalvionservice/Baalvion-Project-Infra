import { ID, Slug } from '@/types/common';

/**
 * @fileOverview Data model for a financial glossary term.
 */
export interface GlossaryTerm {
  id: ID;
  slug: Slug;
  term: string;
  definition: string;
  examples: string[];
  relatedTerms: { term: string; slug: string }[];
  category: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}
