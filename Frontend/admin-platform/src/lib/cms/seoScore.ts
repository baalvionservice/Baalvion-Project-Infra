import type { ContentBlock } from '@/lib/types/cms-content.types';

// Deterministic, client-side, on-page SEO scoring — no external API, no AI call, no
// fabricated numbers. Everything here is computed directly from the draft's own text,
// the same category of heuristic Yoast/Surfer use for "content score" and "keyword
// score." This deliberately does NOT include a "chance to rank vs competitors" figure —
// that requires real competitor/SERP data from a paid provider (Ahrefs/SEMrush/
// DataForSEO) that isn't wired up here; faking that number would be a real footgun for
// an editor who trusts it as a genuine ranking signal.

export interface ChecklistItem {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
}

export interface SeoScoreResult {
  score: number; // 0-100
  checklist: ChecklistItem[];
}

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ');

// Mirrors cms-service's own _extractBlockText (contentService.js) so the score an editor
// sees here roughly matches the word count the server computes at save time.
export function extractPlainText(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => {
      const c = b.content as Record<string, unknown> | undefined;
      if (!c) return '';
      const htmlText = typeof c.html === 'string' ? stripHtml(c.html) : '';
      return [c.text, c.caption, c.title, c.subtitle, htmlText, c.code]
        .filter((v): v is string => typeof v === 'string')
        .join(' ');
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(text: string): number {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function firstParagraph(blocks: ContentBlock[]): string {
  for (const b of blocks) {
    const c = b.content as Record<string, unknown> | undefined;
    const text = typeof c?.text === 'string' ? c.text : typeof c?.html === 'string' ? stripHtml(c.html) : '';
    if (text.trim()) return text;
  }
  return '';
}

function headingTexts(blocks: ContentBlock[]): string[] {
  return blocks
    .filter((b) => b.type === 'heading')
    .map((b) => (typeof b.content?.text === 'string' ? (b.content.text as string) : ''))
    .filter(Boolean);
}

/**
 * Content Score — structural completeness, independent of any keyword. Rewards the
 * things that make a draft genuinely publish-ready: enough substance, broken into
 * readable paragraphs, an actual heading structure, a title and meta description that
 * fit search-result display limits.
 */
export function computeContentScore(input: {
  title: string;
  metaDescription: string;
  blocks: ContentBlock[];
}): SeoScoreResult {
  const { title, metaDescription, blocks } = input;
  const bodyText = extractPlainText(blocks);
  const words = wordCount(bodyText);
  const paragraphCount = blocks.filter((b) => b.type === 'paragraph' || b.type === 'html').length;
  const headings = headingTexts(blocks);

  const checklist: ChecklistItem[] = [
    {
      id: 'length',
      label: 'Body length',
      pass: words >= 300,
      detail: words >= 600 ? `${words} words — solid depth` : words >= 300 ? `${words} words — meets the floor` : `${words} words — thin, aim for 300+`,
    },
    {
      id: 'paragraphs',
      label: 'Broken into paragraphs',
      pass: paragraphCount >= 3,
      detail: `${paragraphCount} paragraph block${paragraphCount === 1 ? '' : 's'}`,
    },
    {
      id: 'headings',
      label: 'Has subheadings',
      pass: headings.length >= 2,
      detail: headings.length ? `${headings.length} heading${headings.length === 1 ? '' : 's'}` : 'No H2/H3 structure yet',
    },
    {
      id: 'title-length',
      label: 'Title fits a search result',
      pass: title.trim().length > 0 && title.trim().length <= 60,
      detail: title.trim().length === 0 ? 'No title yet' : title.trim().length <= 60 ? `${title.trim().length} characters` : `${title.trim().length} characters — Google truncates past ~60`,
    },
    {
      id: 'meta-description',
      label: 'Meta description in range',
      pass: metaDescription.trim().length >= 120 && metaDescription.trim().length <= 160,
      detail: metaDescription.trim().length === 0
        ? 'No meta description set'
        : metaDescription.trim().length < 120
          ? `${metaDescription.trim().length} characters — a bit short (aim 120–160)`
          : metaDescription.trim().length <= 160
            ? `${metaDescription.trim().length} characters — good`
            : `${metaDescription.trim().length} characters — Google truncates past ~160`,
    },
  ];

  const score = Math.round((checklist.filter((c) => c.pass).length / checklist.length) * 100);
  return { score, checklist };
}

/**
 * Keyword Score — how well the draft targets ONE focus keyword (the first entry in the
 * SEO keywords list). Every check here is a real, computable fact about the text: is the
 * term present, and where. No relevance/intent modeling, no external signal.
 */
export function computeKeywordScore(input: {
  focusKeyword: string;
  title: string;
  slug: string;
  metaDescription: string;
  blocks: ContentBlock[];
}): SeoScoreResult | null {
  const kw = input.focusKeyword.trim().toLowerCase();
  if (!kw) return null;

  const bodyText = extractPlainText(input.blocks);
  const words = wordCount(bodyText);
  const intro = firstParagraph(input.blocks);
  const headings = headingTexts(input.blocks);
  const has = (haystack: string) => haystack.toLowerCase().includes(kw);

  // Occurrences of the exact phrase in the body, for a density read.
  const occurrences = kw
    ? (bodyText.toLowerCase().match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length
    : 0;
  const density = words > 0 ? (occurrences / words) * 100 : 0;

  const checklist: ChecklistItem[] = [
    { id: 'in-title', label: 'In the title', pass: has(input.title), detail: has(input.title) ? 'Found' : 'Not found in title' },
    { id: 'in-slug', label: 'In the URL slug', pass: has(input.slug.replace(/-/g, ' ')), detail: has(input.slug.replace(/-/g, ' ')) ? 'Found' : 'Not found in slug' },
    { id: 'in-meta', label: 'In the meta description', pass: has(input.metaDescription), detail: has(input.metaDescription) ? 'Found' : 'Not found in meta description' },
    { id: 'in-intro', label: 'In the opening paragraph', pass: has(intro), detail: has(intro) ? 'Found' : 'Not found in the first paragraph' },
    { id: 'in-heading', label: 'In at least one heading', pass: headings.some(has), detail: headings.some(has) ? 'Found' : 'Not found in any H2/H3' },
    {
      id: 'density',
      label: 'Keyword density',
      pass: density >= 0.4 && density <= 2.5,
      detail: occurrences === 0
        ? 'Keyword never appears in the body'
        : density > 2.5
          ? `${density.toFixed(1)}% — reads as keyword stuffing, dial it back`
          : `${density.toFixed(1)}% (${occurrences}×) — healthy range`,
    },
  ];

  const score = Math.round((checklist.filter((c) => c.pass).length / checklist.length) * 100);
  return { score, checklist };
}
