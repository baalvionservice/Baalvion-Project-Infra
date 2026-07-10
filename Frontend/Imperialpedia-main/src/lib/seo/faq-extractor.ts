/**
 * Heuristic FAQ extraction from an article's rendered HTML body — used as a
 * fallback when the CMS `faq` custom field is empty. AI answer engines
 * (ChatGPT, Perplexity, Google AI Overviews) lean heavily on FAQPage schema
 * for extractable, citable answers, so any article that's already structured
 * with question-headed subheadings gets that schema for free, with no CMS
 * authoring workflow change required.
 *
 * A heading counts as a question if it ends in "?"; the answer is the plain
 * text of the paragraph(s) immediately following it, up to the next heading.
 * Returns [] when fewer than 2 pairs are found — FAQPage schema requires real
 * Q&A content, not padding.
 */

export interface FaqPair {
  question: string;
  answer: string;
}

const stripTags = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

export function extractFaqFromHtml(html: string | null | undefined): FaqPair[] {
  if (!html) return [];

  const blocks = html.match(/<(h[2-4]|p)[^>]*>[\s\S]*?<\/\1>/gi) ?? [];
  const pairs: FaqPair[] = [];
  let pendingQuestion: string | null = null;
  let pendingAnswerParts: string[] = [];

  const flush = () => {
    if (pendingQuestion && pendingAnswerParts.length) {
      const answer = pendingAnswerParts.join(' ').trim();
      if (answer.length >= 20) {
        pairs.push({ question: pendingQuestion, answer });
      }
    }
    pendingQuestion = null;
    pendingAnswerParts = [];
  };

  for (const block of blocks) {
    const isHeading = /^<h[2-4]/i.test(block);
    const text = stripTags(block);
    if (!text) continue;

    if (isHeading) {
      flush();
      if (text.endsWith('?')) {
        pendingQuestion = text;
      }
      continue;
    }

    if (pendingQuestion) {
      pendingAnswerParts.push(text);
    }
  }
  flush();

  return pairs.length >= 2 ? pairs.slice(0, 12) : [];
}
