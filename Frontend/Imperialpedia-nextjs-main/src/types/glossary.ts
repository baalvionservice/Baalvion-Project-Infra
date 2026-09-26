import { ID, Slug } from './common';

/**
 * @fileOverview Glossary and Terminology related types.
 */

export interface GlossaryCategory {
  id: ID;
  name: string;
  slug: Slug;
  description?: string;
}

export interface RelatedTerm {
  term: string;
  slug: Slug;
}

export interface GlossaryTerm {
  id: ID;
  term: string;
  slug: Slug;
  definition: string;
  category: string;
  relatedTerms: RelatedTerm[];
  examples?: string[];
  sources?: string[];
}
