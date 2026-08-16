/**
 * Heuristic FAQ extraction from an article's rendered HTML body — no CMS schema
 * migration required. AI answer engines (ChatGPT, Perplexity, Google AI
 * Overviews) lean heavily on FAQPage schema for extractable, citable answers,
 * so any article that's already structured with recognizable Q&A content gets
 * that schema for free. Two content patterns are recognized:
 *
 * Format A — question-headed subheading (works anywhere in the article, not
 * just under an FAQ section): a heading counts as a question if it ends in
 * "?"; the answer is the plain text of the paragraph(s) immediately following
 * it, up to the next heading.
 *
 *   <h3>Do I need a lawyer for...?</h3>
 *   <p>Answer...</p>
 *
 * Format B — legacy bolded-question paragraph, used by most of the bundled
 * article set: a self-contained <p> whose content starts with a <strong>
 * run ending in "?", followed by inline answer text in the same paragraph.
 * Only recognized inside a heading-marked FAQ section (e.g. "Frequently
 * Asked Questions") so an unrelated bolded lead-in elsewhere in the article
 * (glossary-style "<strong>Term:</strong> definition" paragraphs are common
 * in this content) is never mistaken for a question.
 *
 *   <h2>Frequently Asked Questions</h2>
 *   <p><strong>Question?</strong> Answer...</p>
 *
 * Returns [] when fewer than 2 pairs are found — FAQPage schema requires real
 * Q&A content, not padding.
 */

export interface FaqPair {
  question: string;
  answer: string;
}

const FAQ_SECTION_HEADINGS = new Set(['frequently asked questions', 'faq', 'faqs']);

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

const MIN_ANSWER_LENGTH = 20;

// Matches a paragraph shaped like `<p><strong>Question?</strong> answer...</p>`
// (allowing minor markup/whitespace variance inside the <strong> run, but the
// question itself must be the paragraph's leading content).
const LEGACY_FAQ_PARAGRAPH = /^<p[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*([\s\S]*?)<\/p>$/i;

function parseLegacyFaqParagraph(block: string): FaqPair | null {
  const match = LEGACY_FAQ_PARAGRAPH.exec(block);
  if (!match) return null;
  const question = stripTags(match[1]);
  const answer = stripTags(match[2]);
  if (!question.endsWith('?')) return null;
  if (answer.length < MIN_ANSWER_LENGTH) return null;
  return { question, answer };
}

export function extractFaqFromHtml(html: string | null | undefined): FaqPair[] {
  if (!html) return [];

  const blocks = html.match(/<(h[2-4]|p)[^>]*>[\s\S]*?<\/\1>/gi) ?? [];
  const pairs: FaqPair[] = [];
  const seenQuestions = new Set<string>();
  let pendingQuestion: string | null = null;
  let pendingAnswerParts: string[] = [];
  let inFaqSection = false;

  const push = (pair: FaqPair) => {
    const key = pair.question.trim().toLowerCase();
    if (seenQuestions.has(key)) return;
    seenQuestions.add(key);
    pairs.push(pair);
  };

  const flush = () => {
    if (pendingQuestion && pendingAnswerParts.length) {
      const answer = pendingAnswerParts.join(' ').trim();
      if (answer.length >= MIN_ANSWER_LENGTH) {
        push({ question: pendingQuestion, answer });
      }
    }
    pendingQuestion = null;
    pendingAnswerParts = [];
  };

  for (const block of blocks) {
    const tagMatch = /^<(h[2-4]|p)/i.exec(block);
    const tag = tagMatch?.[1].toLowerCase();

    if (tag === 'h2') {
      // A new top-level section boundary: format A questions elsewhere in
      // the article aren't gated by this, but format B legacy paragraphs
      // only apply within a section headed like "Frequently Asked Questions".
      flush();
      const normalized = stripTags(block).trim().toLowerCase().replace(/[:?]+$/, '');
      inFaqSection = FAQ_SECTION_HEADINGS.has(normalized);
      continue;
    }

    if (tag === 'h3' || tag === 'h4') {
      flush();
      const text = stripTags(block);
      if (text.endsWith('?')) {
        pendingQuestion = text;
      }
      continue;
    }

    // Paragraph block.
    if (pendingQuestion) {
      const text = stripTags(block);
      if (text) pendingAnswerParts.push(text);
      continue;
    }

    if (inFaqSection) {
      const legacyPair = parseLegacyFaqParagraph(block);
      if (legacyPair) push(legacyPair);
    }
  }
  flush();

  return pairs.length >= 2 ? pairs.slice(0, 12) : [];
}
