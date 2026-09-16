import sanitizeHtml from 'sanitize-html';

/**
 * Server-safe HTML sanitizer for CMS-authored rich content.
 *
 * Drop-in replacement for `isomorphic-dompurify`, which pulls in jsdom and
 * breaks `next build` page-data collection on Linux CI (jsdom reads a default
 * stylesheet asset that Next's output tracing does not emit). `sanitize-html`
 * is pure JavaScript — no jsdom — so it builds identically on every platform
 * while preserving allowlist-based sanitization: `<script>`, inline event
 * handlers, and unsafe URL schemes (e.g. `javascript:`) are stripped.
 */
const RICH_TEXT_OPTIONS = {
  allowedTags: [
    'p', 'br', 'hr', 'span', 'div', 'blockquote', 'pre', 'code',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup', 'abbr',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  ],
  allowedAttributes: {
    '*': ['class', 'id'],
    a: ['href', 'name', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    col: ['span'],
  },
  // Links: http/https/mailto/tel only. Images may also use inline `data:` URIs
  // (commonly embedded by editors); an <img> cannot execute script from one.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowProtocolRelative: false,
} satisfies sanitizeHtml.IOptions;

/** Sanitize trusted-but-defensive CMS HTML before `dangerouslySetInnerHTML`. */
export function sanitizeRichHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  return sanitizeHtml(dirty, RICH_TEXT_OPTIONS);
}
