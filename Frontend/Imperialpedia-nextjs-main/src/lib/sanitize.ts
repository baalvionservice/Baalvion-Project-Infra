import sanitizeHtml from 'sanitize-html';
import { canonicalizeInternalHref, isRetiredPath } from '@/lib/content/retired-paths';
import { REMOVED_ARTICLE_PATHS } from '@/lib/content/removed-article-paths';

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
  // CMS-authored prose links by hand, so it goes stale when a category is
  // retired — /about still linked "/personal-finance", which 301s to the
  // homepage. Nobody re-edits every body when the redirect table changes, so
  // a retired link is unwrapped to a plain <span> here: the sentence keeps its
  // wording, the reader stops being bounced back to the homepage, and Google
  // stops seeing internal links into redirects. Applies to every article body
  // and CMS page, not just the ones we happened to notice.
  transformTags: {
    a: (tagName: string, attribs: Record<string, string>) => {
      if (!attribs.href) return { tagName, attribs };
      // Resolve through any 301 first, so the checks below judge the page the
      // reader actually lands on rather than the alias they were given.
      const href = canonicalizeInternalHref(attribs.href);
      const unwrap = () => {
        const { href: _href, target: _target, rel: _rel, ...rest } = attribs;
        return { tagName: 'span', attribs: rest };
      };
      if (isRetiredPath(href)) return unwrap();
      // Articles deleted in the SEO cleanup. /about linked four of them as
      // "popular guides"; three were already on this list and the redirect
      // hid it, because /articles/<slug> 301s to a path that then 404s.
      if (REMOVED_ARTICLE_PATHS.has(href)) return unwrap();
      if (href !== attribs.href) return { tagName, attribs: { ...attribs, href } };
      return { tagName, attribs };
    },
  },
} satisfies sanitizeHtml.IOptions;

/** Sanitize trusted-but-defensive CMS HTML before `dangerouslySetInnerHTML`. */
export function sanitizeRichHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  return sanitizeHtml(dirty, RICH_TEXT_OPTIONS);
}
