/**
 * @deprecated Use real API calls via `@/lib/api-client` instead.
 * This file is kept for backwards compatibility with existing imports.
 */
import { GlossaryTerm, PaginatedResponse, ApiResponse } from '@/types';

/**
 * @fileOverview Mock service for managing financial glossary terms.
 */

const mockTerms: GlossaryTerm[] = [
  {
    id: 'term-1',
    term: 'Bull Market',
    slug: 'bull-market',
    definition: 'A financial market of a group of securities in which prices are rising or are expected to rise.',
    category: 'Markets',
    relatedTerms: [
      { term: 'Bear Market', slug: 'bear-market' },
      { term: 'S&P 500', slug: 'sp-500' },
    ],
    examples: ['The tech boom of the late 90s', 'The post-2009 recovery'],
  },
  {
    id: 'term-2',
    term: 'Bear Market',
    slug: 'bear-market',
    definition: 'A condition in which securities prices fall 20% or more from recent highs amid widespread pessimism.',
    category: 'Markets',
    relatedTerms: [
      { term: 'Bull Market', slug: 'bull-market' },
      { term: 'Recession', slug: 'recession' },
    ],
  },
];

export const getTerms = async (page = 1, limit = 20): Promise<PaginatedResponse<GlossaryTerm>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: mockTerms,
    status: 200,
    pagination: {
      currentPage: page,
      totalPages: 1,
      pageSize: limit,
      totalItems: mockTerms.length,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};

export const getTermBySlug = async (slug: string): Promise<ApiResponse<GlossaryTerm | null>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const term = mockTerms.find((t) => t.slug === slug) || null;
  return {
    data: term,
    status: term ? 200 : 404,
  };
};
