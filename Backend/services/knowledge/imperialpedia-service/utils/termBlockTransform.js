'use strict';
/**
 * Pure transform: cms-service `contentBlocks` -> Imperialpedia frontend's
 * `TermsBodyBlock[]` shape (Frontend/Imperialpedia-main/src/lib/data/terms.ts).
 *
 * cms-service's `contentBlocks[].content` has no enforced per-type shape
 * (validators/contentSchemas.js types it as z.record(z.unknown())) — every read
 * here is defensive against missing/renamed keys rather than assuming a fixed shape.
 */

function wordCount(title) {
    return String(title || '').trim().split(/\s+/).filter(Boolean).length;
}

function isGlossaryEligible(title, maxWords = 2) {
    const count = wordCount(title);
    return count >= 1 && count <= maxWords;
}

function slugifyHeadingId(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function textOf(content) {
    if (!content || typeof content !== 'object') return '';
    return content.text ?? content.value ?? content.body ?? '';
}

function toTextSegments(content) {
    const text = textOf(content);
    if (!text) return null;
    return [{ type: 'text', content: text }];
}

// cms block type -> Term block type. Types with no Term equivalent (video, gallery,
// code, embed, button, columns, divider, html) are simply absent from this map and
// get dropped by cmsBlocksToTermBlocks below, rather than degraded to paragraph —
// the Term renderer (body-block.tsx) has no raw-HTML path, so forcing untrusted or
// unstructured content through as plain text risks garbling it.
const BLOCK_MAPPERS = {
    paragraph: (content) => {
        const segments = toTextSegments(content);
        return segments ? { type: 'paragraph', content: segments } : null;
    },
    heading: (content) => {
        const text = textOf(content);
        if (!text) return null;
        return { type: 'heading', text, id: slugifyHeadingId(text) };
    },
    quote: (content) => {
        const text = textOf(content);
        if (!text) return null;
        const attribution = content.attribution;
        return attribution ? { type: 'quote', text, attribution } : { type: 'quote', text };
    },
    callout: (content) => {
        const segments = toTextSegments(content);
        return segments ? { type: 'callout', content: segments } : null;
    },
    image: (content) => {
        const url = content?.url ?? content?.src;
        if (!url) return null;
        const caption = content?.caption;
        return caption ? { type: 'image', url, caption } : { type: 'image', url };
    },
};

function cmsBlocksToTermBlocks(contentBlocks) {
    if (!Array.isArray(contentBlocks)) return [];
    return contentBlocks
        .map((block) => {
            const mapper = block && BLOCK_MAPPERS[block.type];
            if (!mapper) return null;
            return mapper(block.content || {});
        })
        .filter(Boolean);
}

module.exports = { wordCount, isGlossaryEligible, slugifyHeadingId, cmsBlocksToTermBlocks };
