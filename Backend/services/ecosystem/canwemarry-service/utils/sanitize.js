'use strict';
/**
 * Output hygiene for user-authored text.
 *
 * The frontend renders these fields as text nodes, never as HTML, so this is a second
 * line of defence rather than the only one — it exists because the same JSON is served
 * to a future Expo client and to any other consumer, and one of them will eventually
 * render it somewhere less careful.
 */

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Tab, newline and carriage return are legitimate in a multi-line body; every other
// control character is not. Written as a codepoint test rather than a regex class so
// the source file itself stays free of control characters.
const isControl = (code) => (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) || code === 0x7f;

function stripControl(input) {
    let out = '';
    for (const ch of input) {
        if (!isControl(ch.codePointAt(0))) out += ch;
    }
    return out;
}

/** Strip control characters and neutralise the characters that start a tag. */
function cleanText(value) {
    if (value === null || value === undefined) return value;
    return stripControl(String(value)).replace(/[&<>"']/g, (c) => ENTITIES[c]).trim();
}

/** Collapse runs of blank lines so a body cannot be used to push content off screen. */
function cleanBody(value) {
    if (value === null || value === undefined) return value;
    return cleanText(value).replace(/\n{3,}/g, '\n\n');
}

const cleanFields = (obj, fields) => {
    const out = { ...obj };
    for (const f of fields) if (f in out) out[f] = cleanBody(out[f]);
    return out;
};

module.exports = { cleanText, cleanBody, cleanFields, stripControl };
