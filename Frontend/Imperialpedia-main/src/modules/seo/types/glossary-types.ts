import { GlossaryTerm } from '../models/glossary-term';

/**
 * @fileOverview TypeScript definitions for glossary-related components and pages.
 */

export type { GlossaryTerm };

export interface GlossaryPageProps {
  params: Promise<{ slug: string }>;
}

export interface AlphabetNavProps {
  activeLetter?: string;
}
