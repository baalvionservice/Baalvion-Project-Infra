'use strict';
/**
 * Text extraction + whole-word matching for entity-mention detection
 * (service/entityMentionDetectionService.js). Whole-word/case-insensitive
 * regex-escape matching mirrors mentionsCompany() in
 * Frontend/Imperialpedia-main/src/components/markets/ArticleMarketWidget.tsx
 * (same \b-boundary pattern) so backend detection and the existing frontend
 * scan agree on what counts as a "mention" of a name.
 */

// Only these block types carry real prose that mention-detection should scan.
// Headings/code/html/embed/table/button/divider/image blocks are excluded
// outright — this *is* the "skip headings/code/image captions" rule, applied
// at the block level instead of reconstructing it from an assembled HTML
// string after the fact.
const SCANNABLE_BLOCK_TYPES = new Set(['paragraph', 'quote', 'callout']);

function textOf(content) {
    if (!content || typeof content !== 'object') return '';
    return content.text ?? content.value ?? content.body ?? '';
}

/** Eligible block bodies (inline HTML), in document order. */
function extractTextSegments(contentBlocks) {
    if (!Array.isArray(contentBlocks)) return [];
    return contentBlocks
        .filter((block) => block && SCANNABLE_BLOCK_TYPES.has(block.type))
        .map((block) => textOf(block.content))
        .filter(Boolean);
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tag-aware split of an inline-HTML string (paragraph/quote/callout content
 * may itself contain bold/italic/link markup) into the text runs that are NOT
 * already inside an <a> or inline <code> tag — the "skip existing links /
 * code" rule. A match already wrapped in a real link, or sitting in a code
 * sample, is never re-linked or double-counted.
 */
function eligibleTextRuns(html) {
    const runs = [];
    let insideSkippedTag = false;
    let lastIndex = 0;
    const tagPattern = /<\/?(a|code)\b[^>]*>/gi;
    let match;
    while ((match = tagPattern.exec(html)) !== null) {
        const chunk = html.slice(lastIndex, match.index);
        if (chunk && !insideSkippedTag) runs.push(chunk);
        insideSkippedTag = !match[0].startsWith('</');
        lastIndex = tagPattern.lastIndex;
    }
    const tail = html.slice(lastIndex);
    if (tail && !insideSkippedTag) runs.push(tail);
    return runs;
}

// A match immediately preceded by "://" or a trailing "/" is very likely part
// of a bare URL that slipped into prose, not a real mention — cheap heuristic
// for the "skip URLs" rule without pulling in a URL parser.
function isUrlAdjacent(text, matchIndex) {
    const before = text.slice(Math.max(0, matchIndex - 3), matchIndex);
    return before.includes('://') || before.endsWith('/');
}

/**
 * Whole-word, case-insensitive search for `needle` across `haystack` (an
 * array of block text segments, as returned by extractTextSegments),
 * restricted to runs outside existing links/code/URLs. Returns the
 * as-written matched substring (preserves the article's own casing) on the
 * first eligible hit in document order, or null if there's no real mention.
 */
function findWholeWordMatch(segments, needle) {
    if (!needle) return null;
    const pattern = new RegExp(`\\b${escapeRegExp(needle)}\\b`, 'i');
    for (const segment of segments) {
        for (const run of eligibleTextRuns(segment)) {
            // Strip any remaining (non-a/code) tags so markup characters can't
            // straddle a \b boundary inside the run.
            const plain = run.replace(/<[^>]+>/g, ' ');
            const m = pattern.exec(plain);
            if (m && !isUrlAdjacent(plain, m.index)) return m[0];
        }
    }
    return null;
}

module.exports = { extractTextSegments, findWholeWordMatch, escapeRegExp };
