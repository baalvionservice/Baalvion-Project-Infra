/**
 * Extracts the editor-authored key-takeaways list from an article's rendered
 * HTML body (see the `.key-takeaways` styling in globals.css and the
 * `content` doc comment on `LawArticle`) so it can be rendered as its own
 * top-level "Key Takeaways" section instead of an inline aside inside the
 * article prose -- and removes it from the body HTML so it doesn't render
 * twice.
 *
 * Recognizes two shapes editors actually produce:
 *  1. `<div class="key-takeaways">...</div>` -- the bundled/hand-authored
 *     articles in @/data/articles use this wrapper directly.
 *  2. A plain `<h2>Key Takeaways</h2>` heading block immediately followed by
 *     a `<ul>` block -- what the CMS block editor actually emits (heading
 *     and list are separate content blocks there; there's no UI for authors
 *     to hand-write a wrapper div). Without this second pattern, every
 *     CMS-authored article's key takeaways silently fell back to a plain
 *     inline heading + list instead of the styled callout -- not a fabricated
 *     result, just a missed one, since the extractor only ever read a block
 *     an editor actually wrote either way.
 *
 * Only ever reads bullets editors actually wrote; never generates them from
 * the surrounding prose. Articles matching neither shape simply get no Key
 * Takeaways section (an honest empty beats a fabricated summary).
 */

export interface KeyTakeawaysResult {
  items: string[];
  /** Original HTML with the key-takeaways block removed (empty string in, empty string out). */
  html: string;
}

const KEY_TAKEAWAYS_DIV = /<div class="key-takeaways">([\s\S]*?)<\/div>/i;
const KEY_TAKEAWAYS_HEADING_LIST = /<h[23][^>]*>\s*Key Takeaways\s*<\/h[23]>\s*<ul>([\s\S]*?)<\/ul>/i;
const LIST_ITEM = /<li[^>]*>([\s\S]*?)<\/li>/gi;

// Same decode set as faq-section-extractor.ts's stripTags -- both extractors
// hand plain text straight to JSX (`{item}`), which never decodes HTML
// entities the way dangerouslySetInnerHTML/the browser parser would, so a
// raw "&#39;" from the CMS body renders literally instead of as an apostrophe
// unless decoded here first.
const stripTags = (value: string): string =>
  value
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

function itemsFromListHtml(listHtml: string): string[] {
  const items: string[] = [];
  let liMatch: RegExpExecArray | null;
  LIST_ITEM.lastIndex = 0;
  while ((liMatch = LIST_ITEM.exec(listHtml))) {
    const text = stripTags(liMatch[1]);
    if (text) items.push(text);
  }
  return items;
}

export function extractKeyTakeaways(html: string | null | undefined): KeyTakeawaysResult {
  if (!html) return { items: [], html: html ?? '' };

  for (const pattern of [KEY_TAKEAWAYS_DIV, KEY_TAKEAWAYS_HEADING_LIST]) {
    const match = pattern.exec(html);
    if (!match) continue;
    const items = itemsFromListHtml(match[1]);
    if (items.length === 0) continue;
    const cleaned = (html.slice(0, match.index) + html.slice(match.index + match[0].length)).trim();
    return { items, html: cleaned };
  }

  return { items: [], html };
}
