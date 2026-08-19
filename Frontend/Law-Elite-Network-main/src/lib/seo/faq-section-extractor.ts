/**
 * Extracts a *delineated* "Frequently Asked Questions" section from an
 * article's rendered HTML body -- an `<h2>` matching FAQ_SECTION_HEADINGS,
 * plus every block up to (but not including) the next `<h2>` -- and removes
 * that whole span from the body so it can be rendered once, as its own
 * "Frequently Asked Questions" accordion, instead of twice.
 *
 * Deliberately narrower than `./faq-extractor`'s `extractFaqFromHtml` (which
 * still feeds `article-seo.tsx`'s FAQPage JSON-LD and is untouched by this
 * file): that extractor also recognizes format-A question-headed subheadings
 * (`<h3>...?</h3>`) *anywhere* in an article, not just inside a labeled FAQ
 * section -- appropriate for schema generation, but not safe to physically
 * cut out of the body here, since a scattered `<h3>` question can be a
 * narrative subheading load-bearing for the article's own flow and TOC
 * anchors, not a distinct excisable FAQ block. This extractor only ever
 * removes content that sits inside an explicit, self-contained FAQ section.
 */

export interface FaqSectionResult {
  pairs: { question: string; answer: string }[];
  /** Original HTML with the matched FAQ section removed (empty string in, empty string out). */
  html: string;
}

const FAQ_SECTION_HEADINGS = new Set(['frequently asked questions', 'faq', 'faqs']);
const MIN_ANSWER_LENGTH = 20;

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

// Matches `<p><strong>Question?</strong> answer...</p>` (the legacy format
// most of the bundled article set uses).
const LEGACY_FAQ_PARAGRAPH = /^<p[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*([\s\S]*?)<\/p>$/i;

function parsePairsFromSection(sectionHtml: string): { question: string; answer: string }[] {
  const blocks = sectionHtml.match(/<(h[3-4]|p)[^>]*>[\s\S]*?<\/\1>/gi) ?? [];
  const pairs: { question: string; answer: string }[] = [];
  const seen = new Set<string>();
  let pendingQuestion: string | null = null;
  let pendingAnswerParts: string[] = [];

  const push = (question: string, answer: string) => {
    const key = question.trim().toLowerCase();
    if (seen.has(key) || answer.length < MIN_ANSWER_LENGTH) return;
    seen.add(key);
    pairs.push({ question, answer });
  };

  const flush = () => {
    if (pendingQuestion && pendingAnswerParts.length) {
      push(pendingQuestion, pendingAnswerParts.join(' ').trim());
    }
    pendingQuestion = null;
    pendingAnswerParts = [];
  };

  for (const block of blocks) {
    const tagMatch = /^<(h[3-4]|p)/i.exec(block);
    const tag = tagMatch?.[1].toLowerCase();

    if (tag === 'h3' || tag === 'h4') {
      flush();
      const text = stripTags(block);
      if (text.endsWith('?')) pendingQuestion = text;
      continue;
    }

    if (pendingQuestion) {
      const text = stripTags(block);
      if (text) pendingAnswerParts.push(text);
      continue;
    }

    const legacyMatch = LEGACY_FAQ_PARAGRAPH.exec(block);
    if (legacyMatch) {
      const question = stripTags(legacyMatch[1]);
      const answer = stripTags(legacyMatch[2]);
      if (question.endsWith('?')) push(question, answer);
    }
  }
  flush();

  return pairs;
}

export function extractFaqSection(html: string | null | undefined): FaqSectionResult {
  if (!html) return { pairs: [], html: html ?? '' };

  const headingRe = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let match: RegExpExecArray | null;
  let sectionStart = -1;
  let contentStart = -1;

  while ((match = headingRe.exec(html))) {
    const normalized = stripTags(match[1]).trim().toLowerCase().replace(/[:?]+$/, '');
    if (FAQ_SECTION_HEADINGS.has(normalized)) {
      sectionStart = match.index;
      contentStart = headingRe.lastIndex;
      break;
    }
  }

  if (sectionStart === -1) return { pairs: [], html };

  // Section ends at the next top-level <h2>, or end of the document.
  const nextHeadingMatch = /<h2[^>]*>/i.exec(html.slice(contentStart));
  const sectionEnd = nextHeadingMatch ? contentStart + nextHeadingMatch.index : html.length;

  const pairs = parsePairsFromSection(html.slice(contentStart, sectionEnd));
  if (pairs.length < 2) return { pairs: [], html };

  const cleaned = (html.slice(0, sectionStart) + html.slice(sectionEnd)).trim();
  return { pairs, html: cleaned };
}
