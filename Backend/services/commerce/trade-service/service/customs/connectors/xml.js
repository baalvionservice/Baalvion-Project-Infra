'use strict';
/**
 * XML build + parse for customs messages (Customs Connectors).
 *
 * Dependency-free on purpose. Customs message payloads are the most
 * security-sensitive strings this service produces and consumes, and pulling a
 * general-purpose XML library in for them widens the trusted surface for no gain
 * — what these gateways need is a narrow, predictable subset.
 *
 * BUILDING
 *   Deterministic output: element order follows declaration order, so two
 *   identical declarations serialise byte-identically. That matters because the
 *   message is SIGNED — a non-deterministic serialiser makes a signature
 *   irreproducible and an audit impossible.
 *
 *   Null and undefined values are OMITTED rather than emitted as empty elements.
 *   Customs schemas routinely reject an empty element where they would accept an
 *   absent one, and "<HsCode/>" is a rejection where nothing at all is fine.
 *
 * PARSING
 *   A real tokeniser, not a regex, because a regex over untrusted XML gets the
 *   nesting wrong exactly when it matters. DOCTYPE is REFUSED outright: without
 *   it there is no entity expansion, which forecloses both XXE and the billion-
 *   laughs class of attack on responses we do not control.
 */

const XML_DECL = '<?xml version="1.0" encoding="UTF-8"?>';

/** Escape text content. Order matters — ampersand first or it double-escapes. */
function escapeText(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/** Escape an attribute value (quotes as well as markup). */
function escapeAttr(value) {
    return escapeText(value)
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Serialise a node tree.
 *
 * A node is:
 *   { name, attrs?, text?, cdata?, children?: [node] }
 * `children` may also be given as a plain object of { tag: value }, which is the
 * shorthand the message builders use for flat record blocks.
 */
function buildNode(node, { indent = null, depth = 0 } = {}) {
    if (node === null || node === undefined) return '';

    const pad = indent === null ? '' : indent.repeat(depth);
    const nl = indent === null ? '' : '\n';

    const { name, attrs = {}, text, cdata } = node;
    if (!name) throw new Error('xml.buildNode(): every node needs a name');

    const attrStr = Object.entries(attrs)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
        .join('');

    let children = node.children;
    if (isPlainObject(children)) {
        // { tag: value } shorthand → node list, dropping null/undefined entries.
        children = Object.entries(children)
            .filter(([, v]) => v !== null && v !== undefined)
            .flatMap(([tag, v]) => (Array.isArray(v)
                ? v.map((item) => (isPlainObject(item) && item.name ? item : { name: tag, text: item }))
                : [isPlainObject(v) && v.name ? v : { name: tag, text: v }]));
    }

    const hasChildren = Array.isArray(children) && children.length > 0;
    const hasText = text !== null && text !== undefined && String(text) !== '';
    const hasCdata = cdata !== null && cdata !== undefined && String(cdata) !== '';

    if (!hasChildren && !hasText && !hasCdata) {
        // Absent beats empty — see the module header.
        return node.emptyAllowed ? `${pad}<${name}${attrStr}/>${nl}` : '';
    }

    if (hasCdata) {
        // "]]>" inside CDATA must be split or it terminates the section early.
        const safe = String(cdata).split(']]>').join(']]]]><![CDATA[>');
        return `${pad}<${name}${attrStr}><![CDATA[${safe}]]></${name}>${nl}`;
    }

    if (!hasChildren) {
        return `${pad}<${name}${attrStr}>${escapeText(text)}</${name}>${nl}`;
    }

    const inner = children.map((c) => buildNode(c, { indent, depth: depth + 1 })).join('');
    if (!inner) return node.emptyAllowed ? `${pad}<${name}${attrStr}/>${nl}` : '';
    return `${pad}<${name}${attrStr}>${nl}${inner}${pad}</${name}>${nl}`;
}

/** Serialise a document, with the XML declaration. */
function build(root, { indent = null, declaration = true } = {}) {
    const body = buildNode(root, { indent });
    return (declaration ? XML_DECL + (indent === null ? '' : '\n') : '') + body;
}

/** Convenience for the { tag: value } shorthand. */
const el = (name, children, attrs = {}) => (
    isPlainObject(children) || Array.isArray(children)
        ? { name, attrs, children }
        : { name, attrs, text: children }
);

// ── Parsing ──────────────────────────────────────────────────────────────────

class XmlParseError extends Error {
    constructor(message, position = null) {
        super(position === null ? message : `${message} (at offset ${position})`);
        this.name = 'XmlParseError';
        this.position = position;
    }
}

const ENTITIES = Object.freeze({
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
});

/** Decode the five predefined entities plus numeric refs. Nothing else. */
function decodeEntities(s) {
    return String(s).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, ref) => {
        if (ref[0] === '#') {
            const code = ref[1] === 'x' || ref[1] === 'X'
                ? parseInt(ref.slice(2), 16)
                : parseInt(ref.slice(1), 10);
            return Number.isFinite(code) ? String.fromCodePoint(code) : match;
        }
        // An unknown named entity is left verbatim rather than expanded — there
        // is no DTD, so there is nothing legitimate for it to expand to.
        return Object.prototype.hasOwnProperty.call(ENTITIES, ref) ? ENTITIES[ref] : match;
    });
}

/**
 * Parse into a tree of { name, localName, prefix, attrs, text, children }.
 *
 * Deliberately not a general-purpose parser: no DTD, no entity declarations, no
 * processing instructions beyond the declaration. That is a feature — a customs
 * response has no legitimate use for any of them, and refusing them removes the
 * entity-expansion attack surface entirely.
 */
function parse(xml) {
    const src = String(xml || '');
    if (/<!DOCTYPE/i.test(src)) {
        throw new XmlParseError('DOCTYPE is refused: entity expansion is not permitted when parsing a gateway response');
    }

    let i = 0;
    const len = src.length;

    const skipWs = () => { while (i < len && /\s/.test(src[i])) i += 1; };

    const readName = () => {
        const start = i;
        while (i < len && /[^\s/>=]/.test(src[i])) i += 1;
        if (i === start) throw new XmlParseError('expected a name', i);
        return src.slice(start, i);
    };

    const readAttrs = () => {
        const attrs = {};
        for (;;) {
            skipWs();
            if (i >= len) throw new XmlParseError('unterminated tag', i);
            if (src[i] === '>' || src[i] === '/') return attrs;
            const name = readName();
            skipWs();
            if (src[i] !== '=') { attrs[name] = ''; continue; }
            i += 1;
            skipWs();
            const quote = src[i];
            if (quote !== '"' && quote !== "'") throw new XmlParseError('attribute value must be quoted', i);
            i += 1;
            const start = i;
            while (i < len && src[i] !== quote) i += 1;
            if (i >= len) throw new XmlParseError('unterminated attribute value', start);
            attrs[name] = decodeEntities(src.slice(start, i));
            i += 1;
        }
    };

    const mkNode = (name, attrs) => {
        const colon = name.indexOf(':');
        return {
            name,
            prefix: colon === -1 ? null : name.slice(0, colon),
            localName: colon === -1 ? name : name.slice(colon + 1),
            attrs,
            text: '',
            children: [],
        };
    };

    const parseElement = () => {
        // at '<'
        i += 1;
        const name = readName();
        const attrs = readAttrs();
        const node = mkNode(name, attrs);

        if (src[i] === '/') {
            i += 2; // '/>'
            return node;
        }
        i += 1; // '>'

        for (;;) {
            if (i >= len) throw new XmlParseError(`unclosed element <${name}>`, i);

            if (src.startsWith('<![CDATA[', i)) {
                const end = src.indexOf(']]>', i);
                if (end === -1) throw new XmlParseError('unterminated CDATA section', i);
                node.text += src.slice(i + 9, end);
                i = end + 3;
                continue;
            }
            if (src.startsWith('<!--', i)) {
                const end = src.indexOf('-->', i);
                if (end === -1) throw new XmlParseError('unterminated comment', i);
                i = end + 3;
                continue;
            }
            if (src.startsWith('</', i)) {
                i += 2;
                const closing = readName();
                if (closing !== name) throw new XmlParseError(`</${closing}> does not close <${name}>`, i);
                skipWs();
                if (src[i] !== '>') throw new XmlParseError('malformed closing tag', i);
                i += 1;
                node.text = decodeEntities(node.text).trim();
                return node;
            }
            if (src[i] === '<') {
                node.children.push(parseElement());
                continue;
            }
            const next = src.indexOf('<', i);
            const stop = next === -1 ? len : next;
            node.text += src.slice(i, stop);
            i = stop;
        }
    };

    // Skip the declaration, any leading comments and whitespace.
    for (;;) {
        skipWs();
        if (src.startsWith('<?', i)) {
            const end = src.indexOf('?>', i);
            if (end === -1) throw new XmlParseError('unterminated processing instruction', i);
            i = end + 2;
            continue;
        }
        if (src.startsWith('<!--', i)) {
            const end = src.indexOf('-->', i);
            if (end === -1) throw new XmlParseError('unterminated comment', i);
            i = end + 3;
            continue;
        }
        break;
    }

    if (i >= len || src[i] !== '<') throw new XmlParseError('no root element found', i);
    return parseElement();
}

/**
 * Find the first descendant matching a local name, ignoring namespace prefixes.
 *
 * Prefix-insensitive on purpose: gateways change their prefix between the
 * sandbox and production while keeping the same namespace, and a parser that
 * cares would break on a switchover for no reason.
 */
function find(node, localName) {
    if (!node) return null;
    const want = String(localName).toLowerCase();
    if (node.localName && node.localName.toLowerCase() === want) return node;
    for (const child of node.children || []) {
        const hit = find(child, localName);
        if (hit) return hit;
    }
    return null;
}

/** Every descendant matching a local name. */
function findAll(node, localName, acc = []) {
    if (!node) return acc;
    const want = String(localName).toLowerCase();
    if (node.localName && node.localName.toLowerCase() === want) acc.push(node);
    for (const child of node.children || []) findAll(child, localName, acc);
    return acc;
}

/** Text of the first match, or null. The workhorse of response parsing. */
function text(node, localName) {
    const hit = find(node, localName);
    if (!hit) return null;
    const t = String(hit.text || '').trim();
    return t === '' ? null : t;
}

/** Text of the first match among several candidate names — for spec drift. */
function textAny(node, localNames = []) {
    for (const n of localNames) {
        const t = text(node, n);
        if (t !== null) return t;
    }
    return null;
}

/** Collapse a node to a plain object of localName → text (first occurrence). */
function toObject(node) {
    const out = {};
    for (const child of (node && node.children) || []) {
        if (out[child.localName] === undefined) {
            out[child.localName] = child.children.length ? toObject(child) : (child.text || null);
        }
    }
    return out;
}

module.exports = {
    XML_DECL,
    XmlParseError,
    escapeText,
    escapeAttr,
    buildNode,
    build,
    el,
    parse,
    find,
    findAll,
    text,
    textAny,
    toObject,
    decodeEntities,
};
