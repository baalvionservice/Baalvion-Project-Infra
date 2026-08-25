/**
 * Relevance scoring for site search. Tokenizes the query so a multi-word
 * search like "maryland divorce" matches a title like "Divorce Law in
 * Maryland" (word order shouldn't matter), and tolerates small typos
 * ("divorse") via a bounded Levenshtein distance -- the previous
 * `title.includes(q)` check required the exact phrase as a contiguous
 * substring, so both of those (very ordinary) searches returned nothing.
 */

const MAX_LEVENSHTEIN_LEN = 12; // bound the DP table for pathological input lengths

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const al = Math.min(a.length, MAX_LEVENSHTEIN_LEN);
  const bl = Math.min(b.length, MAX_LEVENSHTEIN_LEN);
  if (al === 0) return bl;
  if (bl === 0) return al;

  const prev = new Array(bl + 1);
  const curr = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;

  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= bl; j++) prev[j] = curr[j];
  }
  return prev[bl];
}

/** True when `word` is within a typo-tolerant edit distance of `token` -- scaled
 * by length so short tokens ("aple") still tolerate 1 typo without matching everything. */
function isFuzzyMatch(word: string, token: string): boolean {
  if (Math.abs(word.length - token.length) > 2) return false;
  const maxDistance = token.length <= 4 ? 1 : token.length <= 8 ? 2 : 3;
  return levenshtein(word, token) <= maxDistance;
}

/** Scores how well one query token matches one text field. Exact/prefix/word
 * matches rank far above a bare substring hit; a fuzzy match ranks lowest of
 * all so correctly-spelled queries always outrank typo-tolerant ones. */
function fieldTokenScore(fieldValue: string, token: string): number {
  if (!fieldValue) return 0;
  if (fieldValue === token) return 100;
  if (fieldValue.startsWith(token)) return 80;

  const words = fieldValue.split(/[\s,/-]+/).filter(Boolean);
  if (words.includes(token)) return 70;
  if (words.some((w) => w.startsWith(token))) return 55;
  if (fieldValue.includes(token)) return 40;
  if (words.some((w) => isFuzzyMatch(w, token))) return 15;
  return 0;
}

/**
 * Scores an article against a (lowercased) query. Every query token must
 * match somewhere in the title or summary -- AND semantics, not OR -- so
 * "maryland divorce" doesn't also surface every article that merely
 * mentions Maryland. Returns 0 (no match) when any token fails.
 */
export function scoreArticle(
  title: string,
  summary: string,
  views: number,
  query: string,
): number {
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;

  const titleLower = title.toLowerCase();
  const summaryLower = (summary || '').toLowerCase();

  let total = 0;
  for (const token of tokens) {
    const titleScore = fieldTokenScore(titleLower, token);
    const summaryScore = fieldTokenScore(summaryLower, token);
    if (titleScore === 0 && summaryScore === 0) return 0;
    total += titleScore * 3 + summaryScore;
  }

  if (titleLower === query) total += 200;
  else if (titleLower.startsWith(query)) total += 100;

  // Popularity only breaks ties among actual text matches -- applying it
  // unconditionally would make every query score > 0 for any viewed
  // article, so unrelated queries would never return "no results".
  if (total > 0) total += views / 1000;
  return total;
}
