import { mergeArticles, getArticleBySlug } from '@/data/law-content';
import { cmsGetArticles } from '@/lib/cms';
import { classifySources } from '@/lib/sources-classify';
import { articleUrl } from '@/lib/article-url';

export interface CitationIndexEntry {
  label: string;
  url?: string;
  articles: { title: string; href: string }[];
}

/**
 * Aggregates the real, editor-entered citations already carried on every
 * guide article's `primarySources` (see the no-fabrication doc comment on
 * `LawArticle.primarySources`) into two site-wide reference indexes -- real
 * court decisions and real legislation, each pointing back to every guide
 * that actually discusses it. Not a live case-reporting or bill-tracking
 * feed (no such data source exists here); this only ever surfaces citations
 * an editor already verified and attached to a guide, via the same
 * `classifySources()` bucketing PrimarySources.tsx uses on an individual
 * article page. Reuses the same CMS-wins-by-slug merge as the homepage
 * (`mergeArticles`), so citations added later via the CMS's CitationsPanel
 * show up here automatically, not just this session's backfill.
 */
export async function buildCitationIndex(): Promise<{
  courtDecisions: CitationIndexEntry[];
  primaryLegislation: CitationIndexEntry[];
}> {
  const cms = await cmsGetArticles().catch(() => []);
  const pool = mergeArticles(cms);

  const courtMap = new Map<string, CitationIndexEntry>();
  const legislationMap = new Map<string, CitationIndexEntry>();

  const addTo = (map: Map<string, CitationIndexEntry>, label: string, url: string | undefined, title: string, href: string) => {
    const existing = map.get(label);
    if (existing) {
      if (!existing.articles.some((a) => a.href === href)) existing.articles.push({ title, href });
      return;
    }
    map.set(label, { label, url, articles: [{ title, href }] });
  };

  for (const article of pool) {
    // mergeArticles() is whole-record precedence, not a field merge: a live
    // CMS record for this slug wins entirely, which silently drops the
    // bundled article's real primarySources if the CMS record was authored
    // without its own citations. Same gap, same fix as
    // src/lib/article-fetch.ts's withBundledSourcesFallback() for the
    // single-article route -- backfill just this field from the bundled
    // article when the live record's own is empty.
    let primarySources = article.primarySources;
    if (!primarySources?.length) {
      primarySources = getArticleBySlug(article.slug)?.primarySources;
    }
    if (!primarySources?.length) continue;
    const classified = classifySources(primarySources);
    const href = articleUrl(article);
    for (const source of classified.courtDecisions) {
      addTo(courtMap, source.label, source.url, article.title, href);
    }
    for (const source of classified.primaryLegislation) {
      addTo(legislationMap, source.label, source.url, article.title, href);
    }
  }

  const sortByLabel = (a: CitationIndexEntry, b: CitationIndexEntry) => a.label.localeCompare(b.label);

  return {
    courtDecisions: [...courtMap.values()].sort(sortByLabel),
    primaryLegislation: [...legislationMap.values()].sort(sortByLabel),
  };
}
