/**
 * @file server/search/schemas.ts
 * @description PROMPT 8 — Zod validation + parsing for the search API boundary.
 * Syntax/ranges are checked here; tenant identity is NEVER accepted from the
 * client (it comes from the verified principal). Facet params accept either
 * repeated (`?country=IN&country=CN`) or comma-separated (`?country=IN,CN`) forms.
 */
import { z } from 'zod';
import { SearchQuery, MAX_PAGE_SIZE } from './types';

/** Collect a multi-valued param from repeats and/or comma lists, de-duplicated. */
function multi(url: URL, name: string): string[] | undefined {
  const out: string[] = [];
  for (const raw of url.searchParams.getAll(name)) {
    for (const part of raw.split(',')) {
      const v = part.trim();
      if (v) out.push(v);
    }
  }
  return out.length ? [...new Set(out)] : undefined;
}

const sortSchema = z.enum(['relevance', 'price_asc', 'price_desc', 'newest']);

export const searchQuerySchema = z.object({
  keyword: z.string().trim().max(200).optional(),
  countries: z.array(z.string().min(1).max(8)).max(100).optional(),
  categories: z.array(z.string().min(1).max(120)).max(100).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  entityTypes: z.array(z.string().min(1).max(64)).max(20).optional(),
  status: z.string().min(1).max(40).optional(),
  sort: sortSchema.optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(MAX_PAGE_SIZE).optional(),
});

function num(url: URL, name: string): number | undefined {
  const raw = url.searchParams.get(name);
  if (raw === null || raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse + validate a `SearchQuery` from request URL params. */
export function parseSearchQuery(url: URL): SearchQuery {
  const countries = multi(url, 'country');
  const candidate = {
    keyword: url.searchParams.get('q') ?? undefined,
    countries: countries?.map((c) => c.toUpperCase()),
    categories: multi(url, 'category'),
    minPrice: num(url, 'minPrice'),
    maxPrice: num(url, 'maxPrice'),
    entityTypes: multi(url, 'entityType'),
    status: url.searchParams.get('status') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
    page: num(url, 'page'),
    pageSize: num(url, 'pageSize'),
  };
  // Drop undefined so optional() applies cleanly.
  const cleaned = Object.fromEntries(Object.entries(candidate).filter(([, v]) => v !== undefined));
  return searchQuerySchema.parse(cleaned);
}

export const reindexSchema = z.object({
  batchSize: z.number().int().min(1).max(2000).optional(),
});
