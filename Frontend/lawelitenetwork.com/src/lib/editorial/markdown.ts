/**
 * The Studio writes in a small Markdown subset (paragraphs, ##/### headings,
 * lists, quotes, **bold**, *italic*, [links](url)) and exports the HTML the
 * CMS stores. Everything is escaped first, so a draft can never inject markup.
 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SAFE_HREF = /^(https?:\/\/|\/(?!\/)|mailto:)/i;

function inline(raw: string): string {
  let out = esc(raw);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, href: string) => {
    const url = href.replace(/&amp;/g, '&');
    if (!SAFE_HREF.test(url)) return text;
    const external = /^https?:\/\//i.test(url);
    return `<a href="${esc(url)}"${external ? ' target="_blank" rel="noopener noreferrer nofollow"' : ''}>${text}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return out;
}

export function markdownToHtml(md: string): string {
  const blocks = md.replace(/\r\n/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block.split('\n');
      const heading = /^(#{2,3})\s+(.+)$/.exec(lines[0]);
      if (heading && lines.length === 1) return `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
      if (lines.every((l) => /^[-*]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`;
      if (lines.every((l) => /^\d+\.\s+/.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`;
      if (lines.every((l) => /^>\s?/.test(l))) return `<blockquote><p>${inline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '))}</p></blockquote>`;
      return `<p>${inline(lines.join(' '))}</p>`;
    })
    .join('\n');
}

/** Plain text of a draft: links keep their anchor text, markup characters go. Used for counting and matching. */
export function stripMarkdown(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*>]\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2');
}

export interface MdLink { text: string; href: string; start: number; end: number }

/** Every [text](href) in the draft, with offsets into the original string. */
export function extractLinks(md: string): MdLink[] {
  const out: MdLink[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  for (let m = re.exec(md); m; m = re.exec(md)) out.push({ text: m[1], href: m[2], start: m.index, end: m.index + m[0].length });
  return out;
}

/** Character ranges where a new link must not be inserted: existing links and heading lines. */
export function protectedRanges(md: string): [number, number][] {
  const ranges: [number, number][] = extractLinks(md).map((l) => [l.start, l.end]);
  const headingRe = /^#{1,6}\s.*$/gm;
  for (let m = headingRe.exec(md); m; m = headingRe.exec(md)) ranges.push([m.index, m.index + m[0].length]);
  return ranges;
}

export const isProtected = (ranges: [number, number][], index: number, length: number) =>
  ranges.some(([a, b]) => index < b && index + length > a);

/** Replaces text[index, index+length) with a Markdown link, keeping the original wording as the anchor. */
export function insertLink(md: string, index: number, length: number, href: string): string {
  return `${md.slice(0, index)}[${md.slice(index, index + length)}](${href})${md.slice(index + length)}`;
}
