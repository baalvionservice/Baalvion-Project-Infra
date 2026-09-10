'use strict';

/**
 * Derive a readable plain-text alternative from an HTML email body.
 *
 * Every HTML message MUST ship a `text/plain` part: it improves deliverability
 * (spam filters penalize HTML-only mail), accessibility (screen readers / text
 * clients), and is the graceful fallback when a client can't render HTML.
 *
 * This is intentionally dependency-free and conservative — it is a *fallback*
 * for templates that don't author their own text, not a full HTML-to-Markdown
 * converter. Templates that provide their own `text` always win.
 *
 * @param {string} html
 * @returns {string}
 */
function htmlToText(html) {
    if (!html) return '';
    let s = String(html);

    // Drop non-content elements entirely (with their contents).
    s = s.replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '');
    s = s.replace(/<!--[\s\S]*?-->/g, '');
    s = s.replace(/<(script|style|head|title|noscript)[\s\S]*?<\/\1>/gi, '');

    // Hidden preheader divs (display:none / opacity:0) are inbox-preview only — strip them.
    s = s.replace(/<div[^>]*(?:display:\s*none|opacity:\s*0)[^>]*>[\s\S]*?<\/div>/gi, '');

    // Turn anchors into "label (href)" so links survive in plain text.
    s = s.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
        const text = stripTags(label).trim();
        const url = String(href).trim();
        if (!url || url.startsWith('mailto:')) return text || url.replace(/^mailto:/, '');
        if (!text || text === url) return url;
        return `${text} (${url})`;
    });

    // Block-level boundaries → newlines.
    s = s.replace(/<\s*br\s*\/?\s*>/gi, '\n');
    s = s.replace(/<\/\s*(p|div|h[1-6]|tr|li|table|thead|tbody|tfoot|header|footer|section|article)\s*>/gi, '\n');
    s = s.replace(/<\s*(li)\b[^>]*>/gi, '\n• ');
    s = s.replace(/<\/\s*(td|th)\s*>/gi, '\t');

    // Strip every remaining tag, then decode the common entities.
    s = stripTags(s);
    s = decodeEntities(s);

    // Collapse whitespace: trim trailing spaces per line, cap blank runs at one.
    s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ');
    return s.trim();
}

function stripTags(s) {
    return String(s).replace(/<[^>]+>/g, '');
}

const ENTITIES = {
    '&nbsp;': ' ',
    '&zwnj;': '',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#039;': "'",
    '&#x27;': "'",
    '&copy;': '©',
    '&mdash;': '—',
    '&ndash;': '–',
};

const ENTITY_RE = /&(?:nbsp|zwnj|amp|lt|gt|quot|copy|mdash|ndash|#0?39|#x27);/gi;

// One pass, not eleven: decoding `&amp;` before `&lt;` turned a stored `&amp;lt;`
// into a literal `<`, undoing an escape the author meant to keep.
function decodeEntities(s) {
    return String(s).replace(ENTITY_RE, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

module.exports = { htmlToText };
