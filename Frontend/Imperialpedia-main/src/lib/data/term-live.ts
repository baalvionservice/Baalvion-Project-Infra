/**
 * Live glossary terms from imperialpedia-service (`/entities?type=term`), where each row's
 * flattened `attributes` is the full frontend `Term`. Used by the async term pages.
 * The sync helpers in `./utils` (getTermUrl / getRelatedTerms) stay on the bundled static set
 * — its slug set is identical (the backend was seeded from it), so links/related still resolve.
 */
import { Term, terms as staticTerms } from './terms';
import { getTermBySlug as staticTermBySlug, getTermsByLetter as staticTermsByLetter } from './utils';

// Glossary definitions are near-static reference content edited by hand, but all
// three reads below were `cache: 'no-store'` — which silently overrode the
// `export const revalidate` on /terms, /terms/[letter] and /terms/[letter]/[slug]
// (89 prerendered pages) and made every request re-render them. A day matches how
// often the glossary actually changes; admin-platform's entity editor can bust it
// through /api/revalidate like any other publish.
const TERM_REVALIDATE_SECONDS = 86400;

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1'
    : 'http://localhost:3004/api/v1');

export async function fetchTermBySlug(slug: string): Promise<Term | undefined> {
  try {
    const res = await fetch(`${IMP_API}/entities/term/${encodeURIComponent(slug)}`, {
      next: { revalidate: TERM_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = (await res.json())?.data;
      if (data?.slug && data?.content) return data as Term;
    }
  } catch {
    /* fall through to static */
  }
  return staticTermBySlug(slug);
}

export async function fetchTermsByLetter(letter: string): Promise<Term[]> {
  try {
    const res = await fetch(`${IMP_API}/entities?type=term&limit=500`, {
      next: { revalidate: TERM_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const items = (((await res.json())?.data?.items ?? []) as Term[]).filter((t) => t?.title);
      if (items.length) {
        return letter === 'num'
          ? items.filter((t) => /^[0-9]/.test(t.title))
          : items.filter((t) => t.title.toLowerCase().startsWith(letter.toLowerCase()));
      }
    }
  } catch {
    /* fall through to static */
  }
  return staticTermsByLetter(letter);
}

export async function fetchAllTerms(): Promise<Term[]> {
  try {
    const res = await fetch(`${IMP_API}/entities?type=term&limit=500`, {
      next: { revalidate: TERM_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const items = (((await res.json())?.data?.items ?? []) as Term[]).filter(
        (t) => t?.title && t?.slug,
      );
      if (items.length) return items;
    }
  } catch {
    /* fall through to static */
  }
  return [...staticTerms];
}
