/**
 * @fileOverview Server-side data loader for the public Imperialpedia Glossary.
 *
 * LIVE source: imperialpedia-service public API
 *   GET {IMP_API}/glossary?search=&difficulty=&category=&limit=  → data.items (list, published-only)
 *   GET {IMP_API}/glossary/term/:slug                            → data (full term detail)
 *
 * Response envelope is `{ success, data, meta }`. These run server-side (RSC) — the
 * service is reachable on localhost without CORS. Failures degrade gracefully: the
 * list returns `[]` and a missing/erroring term returns `undefined` so the detail
 * page can call `notFound()`.
 */

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL || 'http://localhost:3004/api/v1';

export type GlossaryDifficulty = string;

// ── Wire shapes (envelope payloads) ─────────────────────────────────────────
export interface GlossaryListItem {
  id: string;
  term: string;
  slug: string;
  short_def: string;
  difficulty: GlossaryDifficulty;
  category: string;
  status: string;
}

export interface GlossaryReference {
  title: string;
  url: string;
  kind: string;
}

export interface GlossaryExample {
  title: string;
  body: string;
}

export interface GlossaryRelation {
  relation: string;
  related: {
    term: string;
    slug: string;
    difficulty: GlossaryDifficulty;
  };
}

export interface GlossaryTerm {
  term: string;
  slug: string;
  short_def: string;
  full_def: string;
  formula_latex?: string | null;
  pronunciation?: string | null;
  aliases?: string[];
  references?: GlossaryReference[];
  difficulty: GlossaryDifficulty;
  category: string;
  examples?: GlossaryExample[];
  relations?: GlossaryRelation[];
}

export interface GlossaryQuery {
  search?: string;
  difficulty?: string;
  category?: string;
  limit?: number;
}

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: unknown;
}

const DEFAULT_LIMIT = 500;

/**
 * Fetch the published glossary index. Returns `[]` on transport/non-OK errors so
 * the index page always renders.
 */
export async function listGlossaryTerms(
  query: GlossaryQuery = {},
): Promise<GlossaryListItem[]> {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.difficulty) params.set('difficulty', query.difficulty);
  if (query.category) params.set('category', query.category);
  params.set('limit', String(query.limit ?? DEFAULT_LIMIT));

  try {
    const res = await fetch(`${IMP_API}/glossary?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = (await res.json()) as Envelope<{ items?: GlossaryListItem[] }>;
    return json?.data?.items ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetch a single glossary term by slug. Returns `undefined` on 404 or any error
 * so callers can invoke `notFound()`.
 */
export async function getGlossaryTermBySlug(
  slug: string,
): Promise<GlossaryTerm | undefined> {
  try {
    const res = await fetch(
      `${IMP_API}/glossary/term/${encodeURIComponent(slug)}`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' },
    );
    if (!res.ok) return undefined;
    const json = (await res.json()) as Envelope<GlossaryTerm | null>;
    return json?.data ?? undefined;
  } catch {
    return undefined;
  }
}
