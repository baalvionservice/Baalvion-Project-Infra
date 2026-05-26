import { terms, Term } from "./terms";

export const getTermsByLetter = (letter: string) => {
  if (letter === "num") {
    return terms.filter((t) => /^[0-9]/.test(t.title));
  }

  return terms.filter((t) =>
    t.title.toLowerCase().startsWith(letter.toLowerCase())
  );
};

export const getTermBySlug = (slug: string) => {
  return terms.find((t) => t.slug === slug);
};

export const getTermUrl = (slug: string) => {
  const term = getTermBySlug(slug);
  if (!term) return `/terms/${slug}`;

  const firstChar = term.title.charAt(0).toLowerCase();
  const letter = /^[0-9]/.test(firstChar) ? "num" : firstChar;

  return `/terms/${letter}/${slug}`;
};

/**
 * Get related terms based on content similarity and shared keywords
 */
export function getRelatedTerms(
  currentSlug: string,
  limit: number = 3
): Term[] {
  const currentTerm = getTermBySlug(currentSlug);
  if (!currentTerm) return [];

  // Extract keywords from title and description for similarity matching
  const currentKeywords = extractKeywords(
    currentTerm.title + " " + currentTerm.seoDescription
  );

  // Score other terms based on keyword overlap
  const scoredTerms = terms
    .filter((term) => term.slug !== currentSlug)
    .map((term) => {
      const termKeywords = extractKeywords(term.title + " " + term.seoDescription);
      const score = calculateSimilarityScore(currentKeywords, termKeywords);
      return { term, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ term }) => term);

  // If we don't have enough related terms, fill with random terms
  if (scoredTerms.length < limit) {
    const remainingSlots = limit - scoredTerms.length;
    const usedSlugs = new Set([currentSlug, ...scoredTerms.map((t) => t.slug)]);
    const randomTerms = terms
      .filter((term) => !usedSlugs.has(term.slug))
      .sort(() => Math.random() - 0.5)
      .slice(0, remainingSlots);

    return [...scoredTerms, ...randomTerms];
  }

  return scoredTerms;
}

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "must",
    "shall",
    "how",
    "what",
    "when",
    "where",
    "why",
    "who",
    "which",
    "that",
    "this",
    "these",
    "those",
    "it",
    "its",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
}

/**
 * Calculate similarity score between two sets of keywords
 */
function calculateSimilarityScore(
  keywords1: string[],
  keywords2: string[]
): number {
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));

  if (set1.size === 0 || set2.size === 0) return 0;

  // Jaccard similarity coefficient
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}
