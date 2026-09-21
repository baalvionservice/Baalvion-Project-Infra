'use strict';
const metrics = require('./textMetrics');

const OVERLAP = 0.25; // the same threshold citationCoveragePct uses, so the panel and the gate always agree

/**
 * Every sentence of a draft, in reading order, with what backs it.
 *
 * `checkable` = the gate would count it as a claim (a figure, a currency amount or a quotation).
 * `source`    = the citation whose claim overlaps this sentence, or null.
 * A checkable sentence with no source is what pulls citation coverage down. A plain sentence can still be
 * unsupported (the gate cannot see "one of the most prestigious festivals"), so the reviewer sees every sentence, and
 * a statement with no source that is not a plain "we don't know" line is reported as `unsourced`.
 */
function claimReport(bodyText, citations = []) {
    const claims = (Array.isArray(citations) ? citations : [])
        .map((c) => ({ c, words: new Set(metrics.contentWords(c && (c.claim || c.text) ? c.claim || c.text : '')) }))
        .filter((x) => x.words.size);

    const rows = metrics.sentences(bodyText).map((text) => {
        const checkable = metrics.isFactual(text);
        const words = new Set(metrics.contentWords(text));
        let best = null; let bestScore = 0;
        for (const x of claims) {
            const score = metrics.jaccard(words, x.words);
            if (score >= OVERLAP && score > bestScore) { best = x.c; bestScore = score; }
        }
        // "What we don't know yet" lines assert nothing, so they need no source.
        const disclaimer = metrics.DISCLAIMS_KNOWLEDGE.test(text);
        return { text, checkable, disclaimer, source: best ? { name: best.sourceName || null, url: best.sourceUrl || null } : null };
    });

    const checkableRows = rows.filter((r) => r.checkable);
    return {
        sentences: rows,
        checkable: checkableRows.length,
        uncited: checkableRows.filter((r) => !r.source).length,
        unsourced: rows.filter((r) => !r.checkable && !r.disclaimer && !r.source).length,
    };
}

module.exports = { claimReport, OVERLAP };
