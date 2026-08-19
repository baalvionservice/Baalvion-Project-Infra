/**
 * Extracts the editor-authored `<div class="key-takeaways">...</div>` block
 * from an article's rendered HTML body (see the `.key-takeaways` styling in
 * globals.css and the `content` doc comment on `LawArticle`) so it can be
 * rendered as its own top-level "Key Takeaways" section instead of an inline
 * aside inside the article prose -- and removes it from the body HTML so it
 * doesn't render twice.
 *
 * Only ever reads a block editors actually wrote; never generates bullets
 * from the surrounding prose. Articles without the block simply get no Key
 * Takeaways section (see the extractor's own doc comment for the reasoning
 * this mirrors: an honest empty beats a fabricated summary).
 */

export interface KeyTakeawaysResult {
  items: string[];
  /** Original HTML with the key-takeaways block removed (empty string in, empty string out). */
  html: string;
}

const KEY_TAKEAWAYS_BLOCK = /<div class="key-takeaways">([\s\S]*?)<\/div>/i;
const LIST_ITEM = /<li[^>]*>([\s\S]*?)<\/li>/gi;

const stripTags = (value: string): string => value.replace(/<[^>]+>/g, '').trim();

export function extractKeyTakeaways(html: string | null | undefined): KeyTakeawaysResult {
  if (!html) return { items: [], html: html ?? '' };

  const match = KEY_TAKEAWAYS_BLOCK.exec(html);
  if (!match) return { items: [], html };

  const items: string[] = [];
  let liMatch: RegExpExecArray | null;
  LIST_ITEM.lastIndex = 0;
  while ((liMatch = LIST_ITEM.exec(match[1]))) {
    const text = stripTags(liMatch[1]);
    if (text) items.push(text);
  }

  if (items.length === 0) return { items: [], html };

  const cleaned = (html.slice(0, match.index) + html.slice(match.index + match[0].length)).trim();
  return { items, html: cleaned };
}
