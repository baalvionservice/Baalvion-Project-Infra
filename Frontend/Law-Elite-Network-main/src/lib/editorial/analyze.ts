import { findNameMatches } from '@/lib/entity-mentions';
import { extractLinks, isProtected, protectedRanges, stripMarkdown } from '@/lib/editorial/markdown';
import type { EntityReference } from '@/types/entity-tagging';

/** What the analysis needs to know about the site. Built once on the server (see context.ts) and passed in, so this module stays pure. */
export interface CatalogEntity {
  ref: EntityReference;
  label: string;
  /** Every spelling the tagger matches. */
  names: string[];
  kind: string;
  url: string;
}

export interface CatalogArticle {
  slug: string;
  title: string;
  url: string;
  entities: EntityReference[];
}

export interface Catalog {
  entities: CatalogEntity[];
  articles: CatalogArticle[];
  /** entity key -> entity keys it is explicitly connected to (co-star, court, party...). */
  relations: Map<string, string[]>;
  /** 6-word runs of every existing article -> slug of the article they came from. */
  grams: Map<string, string>;
}

export interface DraftInput { title: string; body: string; excerpt?: string }

export interface EntityHit {
  key: string;
  label: string;
  kind: string;
  url: string;
  count: number;
  linked: boolean;
}

export interface LinkSuggestion {
  id: string;
  type: 'entity' | 'article';
  label: string;
  reason: string;
  href: string;
  /** Offset and length of the wording in the draft that becomes the anchor. */
  index: number;
  length: number;
}

export interface RelatedSuggestion { key: string; label: string; kind: string; url: string; why: string }
export type CheckLevel = 'ok' | 'warn' | 'error';
export interface Check { id: string; level: CheckLevel; message: string }

export interface Analysis {
  words: number;
  readingMinutes: number;
  entities: EntityHit[];
  links: LinkSuggestion[];
  related: RelatedSuggestion[];
  checks: Check[];
  originality: { overlapPct: number; source?: string };
}

export const keyOf = (r: EntityReference) => `${r.entityType}:${r.slug}`;

const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'what', 'when', 'how', 'why', 'are', 'was', 'your', 'you', 'not', 'but', 'has', 'have', 'its', 'into', 'about', 'their', 'they', 'will', 'can', 'all', 'one', 'who']);
const words = (s: string) => s.toLowerCase().match(/[a-z0-9’']+/g) ?? [];
const norm = (s: string) => words(s).join(' ');

export function analyzeDraft(draft: DraftInput, catalog: Catalog): Analysis {
  const body = draft.body || '';
  const plain = stripMarkdown(body);
  const wordCount = words(plain).length;
  const links = extractLinks(body);
  const linkedHrefs = new Set(links.map((l) => l.href.replace(/[#?].*$/, '').replace(/\/$/, '')));
  const isLinked = (url: string) => linkedHrefs.has(url.replace(/\/$/, ''));
  const guarded = protectedRanges(body);

  // ── Entities the tagger will connect, with where each first appears ──
  const entities: EntityHit[] = [];
  const suggestions: LinkSuggestion[] = [];
  const mentioned = new Set<string>();

  // The tagger reads title, summary and body, so all three count as mentions; only the body can hold a link.
  const heading = `${draft.title || ''}\n${draft.excerpt || ''}\n`;
  for (const e of catalog.entities) {
    const all = findNameMatches(body, e.names);
    const elsewhere = findNameMatches(heading, e.names).length;
    if (all.length + elsewhere === 0) continue;
    const key = keyOf(e.ref);
    mentioned.add(key);
    entities.push({ key, label: e.label, kind: e.kind, url: e.url, count: all.length + elsewhere, linked: isLinked(e.url) });
    // Countries are tagged but never worth a link of their own.
    if (e.ref.entityType !== 'country' && !isLinked(e.url)) {
      const spot = all.find((m) => !isProtected(guarded, m.index, m.length));
      if (spot) {
        suggestions.push({
          id: `entity:${key}`, type: 'entity', label: e.label, href: e.url, index: spot.index, length: spot.length,
          reason: `${e.kind} page. Mentioned ${all.length + elsewhere}×, not linked yet`,
        });
      }
    }
  }

  // ── Existing articles worth linking to ──
  const mentionedRefs = new Set(mentioned);
  const draftWords = words(plain);
  const scored: { article: CatalogArticle; score: number; shared: string[]; anchor?: { index: number; length: number; text: string } }[] = [];
  for (const a of catalog.articles) {
    if (isLinked(a.url)) continue;
    if (norm(a.title) === norm(draft.title)) continue;
    // A shared country says nothing about relevance; only people, cases, courts, works and topics count.
    const shared = a.entities.filter((r) => r.entityType !== 'country' && mentionedRefs.has(keyOf(r)));
    const anchor = bestAnchor(body, a.title, guarded) ?? undefined;
    if (shared.length === 0 && !anchor) continue;
    scored.push({ article: a, score: shared.length * 3 + (anchor ? anchor.text.split(' ').length : 0), shared: shared.map((r) => r.slug), anchor });
  }
  scored.sort((x, y) => y.score - x.score);
  for (const s of scored.slice(0, 6)) {
    const sharedLabels = s.shared.map((slug) => catalog.entities.find((e) => e.ref.slug === slug)?.label ?? slug);
    // Without a phrase in the draft to hang the link on, offer it as a "see also" (index -1).
    suggestions.push({
      id: `article:${s.article.slug}`, type: 'article', label: s.article.title, href: s.article.url,
      index: s.anchor?.index ?? -1, length: s.anchor?.length ?? 0,
      reason: s.anchor && sharedLabels.length
        ? `Shares ${sharedLabels.slice(0, 2).join(', ')}; “${s.anchor.text}” is in your draft`
        : s.anchor ? `Its title phrase “${s.anchor.text}” is in your draft` : `Shares ${sharedLabels.slice(0, 3).join(', ')}`,
    });
  }

  // ── Connected entities the draft does not mention yet ──
  const related: RelatedSuggestion[] = [];
  const seen = new Set<string>();
  for (const hit of entities) {
    for (const rel of catalog.relations.get(hit.key) ?? []) {
      if (mentioned.has(rel) || seen.has(rel)) continue;
      const target = catalog.entities.find((e) => keyOf(e.ref) === rel);
      if (!target) continue;
      seen.add(rel);
      related.push({ key: rel, label: target.label, kind: target.kind, url: target.url, why: `Connected to ${hit.label}` });
    }
  }

  // ── Originality against LEN's own library ──
  const originality = ownLibraryOverlap(draftWords, catalog.grams);

  // ── Checks ──
  const checks: Check[] = [];
  const add = (id: string, level: CheckLevel, message: string) => checks.push({ id, level, message });
  const t = draft.title.trim().length;
  add('title', t >= 30 && t <= 70 ? 'ok' : 'warn', t === 0 ? 'Add a title' : `Title is ${t} characters (aim for 30–70 so it is not cut off in search)`);
  const ex = (draft.excerpt || '').trim().length;
  add('excerpt', ex >= 80 && ex <= 160 ? 'ok' : 'warn', ex === 0 ? 'Add a summary (80–160 characters), used as the search description' : `Summary is ${ex} characters (aim for 80–160)`);
  add('length', wordCount >= 300 ? 'ok' : 'warn', wordCount >= 300 ? `${wordCount} words` : `${wordCount} words: thin for a standalone article. Add substance, not filler`);
  const h2 = (body.match(/^##\s/gm) || []).length;
  add('headings', h2 >= 2 || wordCount < 400 ? 'ok' : 'warn', h2 >= 2 ? `${h2} sections` : 'Break a long article into sections with ## headings');
  const internal = links.filter((l) => l.href.startsWith('/')).length;
  add('internal', internal >= 3 ? 'ok' : 'warn', `${internal} internal link${internal === 1 ? '' : 's'} (aim for 3 or more)`);
  const external = links.filter((l) => /^https?:\/\//i.test(l.href)).length;
  add('sources', external >= 1 ? 'ok' : 'warn', external >= 1 ? `${external} outside source${external === 1 ? '' : 's'} cited` : 'Cite at least one outside source for the facts you state');
  add('entities', entities.length > 0 ? 'ok' : 'warn', entities.length > 0 ? `${entities.length} people, cases or topics will be connected automatically` : 'No known people, cases or topics are named, so this article will not appear on any profile');
  add('originality', originality.overlapPct > 15 ? 'error' : originality.overlapPct > 5 ? 'warn' : 'ok',
    originality.overlapPct > 5 ? `${originality.overlapPct}% of runs match “${originality.source}”. Reword` : 'No copied passages found in LEN’s own library');
  const dup = catalog.articles.find((a) => jaccard(words(a.title), words(draft.title)) >= 0.8 && draft.title.trim());
  if (dup) add('duplicate', 'error', `Title is almost the same as an existing article: “${dup.title}”`);

  return {
    words: wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / 220)),
    entities, links: suggestions, related, checks, originality,
  };
}

/** The longest phrase from an article's title (2–5 words, not all filler) that appears unprotected in the draft. */
function bestAnchor(body: string, title: string, guarded: [number, number][]): { index: number; length: number; text: string } | null {
  const tw = title.split(/\s+/).map((w) => w.replace(/[^\w’'-]/g, '')).filter(Boolean);
  for (let n = Math.min(5, tw.length); n >= 2; n--) {
    for (let i = 0; i + n <= tw.length; i++) {
      const phrase = tw.slice(i, i + n);
      if (phrase.every((w) => STOP.has(w.toLowerCase()) || w.length < 3)) continue;
      const text = phrase.join(' ');
      const re = new RegExp(`\\b${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}\\b`, 'gi');
      for (let m = re.exec(body); m; m = re.exec(body)) {
        if (!isProtected(guarded, m.index, m[0].length)) return { index: m.index, length: m[0].length, text: m[0] };
      }
    }
  }
  return null;
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a); const B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((x) => B.has(x) && inter++);
  return inter / (A.size + B.size - inter);
}

/** Share of the draft's 6-word runs that already appear in a published LEN article, and which article contributes most. */
export function ownLibraryOverlap(draftWords: string[], grams: Map<string, string>): { overlapPct: number; source?: string } {
  if (draftWords.length < 6) return { overlapPct: 0 };
  let total = 0; let hit = 0;
  const bySource = new Map<string, number>();
  for (let i = 0; i + 6 <= draftWords.length; i++) {
    total++;
    const src = grams.get(draftWords.slice(i, i + 6).join(' '));
    if (src) { hit++; bySource.set(src, (bySource.get(src) || 0) + 1); }
  }
  const top = [...bySource.entries()].sort((a, b) => b[1] - a[1])[0];
  return { overlapPct: Math.round((100 * hit) / total), source: top?.[0] };
}

export const gramsOf = (text: string): string[] => {
  const w = words(text);
  return Array.from({ length: Math.max(0, w.length - 5) }, (_, i) => w.slice(i, i + 6).join(' '));
};
