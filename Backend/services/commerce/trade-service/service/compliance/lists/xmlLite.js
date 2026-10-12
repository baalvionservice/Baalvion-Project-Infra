'use strict';
/**
 * Minimal XML reading for the three official sanctions-list exports.
 *
 * These files are machine-generated, regular, and large (tens of MB), and none
 * of the elements we read nest inside themselves. That lets us slice the file
 * into record blocks with a single pass and read fields out of each block,
 * without a general XML parser dependency. This is deliberately NOT a general
 * parser: if a publisher changes the structure, the record-count checks in the
 * importer fail the run instead of importing something half-read.
 */

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function unescapeXml(s) {
    if (s == null) return '';
    return String(s).replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, e) => {
        if (e[0] === '#') {
            const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
            return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
        }
        return Object.prototype.hasOwnProperty.call(NAMED, e) ? NAMED[e] : m;
    });
}

const esc = (tag) => tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Every `<tag ...>...</tag>` block (non-nesting) in document order. */
function blocks(xml, tag) {
    const re = new RegExp(`<${esc(tag)}(?:\\s[^>]*)?>[\\s\\S]*?</${esc(tag)}>`, 'g');
    return xml.match(re) || [];
}

/** Text of the first `<tag>` in a block, trimmed and unescaped; '' when absent or empty. */
function text(block, tag) {
    const m = new RegExp(`<${esc(tag)}(?:\\s[^>]*)?>([\\s\\S]*?)</${esc(tag)}>`).exec(block);
    return m ? unescapeXml(m[1]).trim() : '';
}

/** Text of every `<tag>` in a block, non-empty only. */
function texts(block, tag) {
    const re = new RegExp(`<${esc(tag)}(?:\\s[^>]*)?>([\\s\\S]*?)</${esc(tag)}>`, 'g');
    const out = [];
    let m;
    while ((m = re.exec(block))) {
        const v = unescapeXml(m[1]).trim();
        if (v) out.push(v);
    }
    return out;
}

/** Attributes of every opening `<tag ...>` (or `<tag .../>`) in a block. */
function openTags(block, tag) {
    const re = new RegExp(`<${esc(tag)}\\b([^>]*?)/?>`, 'g');
    const out = [];
    let m;
    while ((m = re.exec(block))) out.push(attributes(m[1]));
    return out;
}

function attributes(raw) {
    const attrs = {};
    const re = /([\w:.-]+)\s*=\s*"([^"]*)"/g;
    let m;
    while ((m = re.exec(raw))) attrs[m[1]] = unescapeXml(m[2]);
    return attrs;
}

/** Attributes on the root-most opening tag of a block (the record element itself). */
function rootAttributes(block) {
    const m = /^<[\w:.-]+\b([^>]*?)\/?>/.exec(block);
    return m ? attributes(m[1]) : {};
}

module.exports = { blocks, text, texts, openTags, attributes, rootAttributes, unescapeXml };
