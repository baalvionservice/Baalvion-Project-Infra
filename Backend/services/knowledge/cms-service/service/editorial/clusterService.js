'use strict';

/**
 * Stage 2 — clustering. Groups accepted signals that are covering the same event.
 *
 * This is what turns a feed into a newsroom. Without it the desk sees "South
 * Florida Men Sentenced for $34.8M Health Care Fraud" and "Florida Men Sentenced
 * for $34.8M Health Care Fraud Scheme" as two stories, and would write both. With
 * it they are one story with two sources -- which is also the only way to satisfy
 * the charter's minimum-sources rule honestly.
 *
 * Similarity is Jaccard overlap on stemmed content tokens, gated by shared
 * *distinctive* tokens. The gate matters: headlines in one beat share a lot of
 * ordinary vocabulary, so two unrelated recall notices overlap heavily on words
 * that say nothing about which recall it is.
 *
 * Distinctiveness is measured by rarity across the window (document frequency),
 * not by capitalisation. Capitalisation was the first attempt and it failed
 * outright: government press releases are Title Case, so every word reads as a
 * proper noun, and the clusterer merged "B. Braun Recalls Sodium Chloride" with
 * "American Regent Recalls Epinephrine" -- two unrelated recalls -- on the shared
 * boilerplate. Rarity gets it right for the same reason a human does: "Gizoon"
 * and "$34.8M" identify a story, "Recall" and "Risk" do not.
 */

const { Op } = require('sequelize');
const { CmsStorySignal } = require('../../models');

// Words that carry no signal about which story a headline is. Deliberately
// headline-shaped ("says", "after", "amid") rather than a generic stopword list.
const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'from',
    'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'will', 'would',
    'can', 'could', 'should', 'may', 'might', 'must', 'that', 'this', 'these', 'those', 'it',
    'its', 'they', 'their', 'his', 'her', 'he', 'she', 'we', 'our', 'you', 'your', 'not', 'no',
    'new', 'says', 'said', 'say', 'after', 'over', 'amid', 'into', 'out', 'up', 'down', 'more',
    'most', 'than', 'how', 'why', 'what', 'when', 'who', 'which', 'now', 'still', 'just', 'about',
    'first', 'last', 'next', 'two', 'three', 'here', 'there', 'all', 'some', 'other', 'one',
]);

function stem(word) {
    let w = word;
    if (w.length > 6 && w.endsWith('ments')) return w.slice(0, -5);
    if (w.length > 5 && w.endsWith('ment')) return w.slice(0, -4);
    if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
    if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
    if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
    if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    return w;
}

/** Content tokens: stemmed, stopworded, 3+ chars. */
function contentTokens(text) {
    const words = String(text || '').toLowerCase().match(/[a-z0-9$.]+/g) || [];
    return new Set(
        words
            .map((w) => w.replace(/^[.$]+|[.]+$/g, ''))
            .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
            .map(stem)
    );
}

/**
 * Figures, normalised so "$34.8M" and "34.8 million" reduce to the same token.
 * A shared figure is among the strongest signals that two headlines describe one
 * event.
 */
function figureTokens(text) {
    const out = new Set();
    for (const m of String(text || '').match(/\$?\d[\d,.]*\s?(?:%|percent|billion|bn|million|m|k|trillion)?/gi) || []) {
        const norm = m.toLowerCase().replace(/[\s,$]/g, '')
            .replace(/billion|bn/, 'b').replace(/million/, 'm').replace(/trillion/, 't')
            .replace(/percent/, '%');
        if (/\d/.test(norm) && norm.length >= 2) out.add(norm);
    }
    return out;
}

/**
 * Document frequency over the window: how many headlines each token appears in.
 * This is what makes rarity measurable rather than guessed.
 */
function buildDocumentFrequency(tokenSets) {
    const df = new Map();
    for (const set of tokenSets) {
        for (const t of set) df.set(t, (df.get(t) || 0) + 1);
    }
    return df;
}

const idf = (token, df, corpusSize) => Math.log(corpusSize / (1 + (df.get(token) || 0)));

/**
 * A headline's signature: its SIGNATURE_SIZE rarest tokens.
 *
 * A rarity cutoff -- "distinctive means df below X" -- does not work at either
 * end. Set X low and a small corpus makes the two headlines being compared
 * mutually distinctive purely because they share a word. Set it as a share of
 * corpus size and it grows with the corpus, so at 496 headlines a ceiling of 9
 * still admitted "voluntary" and "nationwide" and re-merged the two unrelated
 * recalls it was written to separate.
 *
 * Taking the rarest few tokens per headline sidesteps the cutoff entirely. It
 * asks the question a person asks: what is this story actually about? For the
 * two recall notices the answers are {braun, chloride, sodium} and {regent,
 * epinephrine, american} -- no overlap, two stories. For the two fraud
 * sentencings they are {34.8m, florida, medicare} and {34.8m, florida,
 * medicaid} -- one story.
 */
const SIGNATURE_SIZE = 5;

function signatureOf(tokens, df, corpusSize) {
    return new Set(
        [...tokens]
            .sort((a, b) => idf(b, df, corpusSize) - idf(a, df, corpusSize) || b.length - a.length)
            .slice(0, SIGNATURE_SIZE)
    );
}

function jaccard(a, b) {
    if (!a.size || !b.size) return 0;
    let shared = 0;
    for (const t of a) if (b.has(t)) shared += 1;
    return shared / (a.size + b.size - shared);
}

function sharedCount(a, b) {
    let n = 0;
    for (const t of a) if (b.has(t)) n += 1;
    return n;
}

// Tuned on a live wire pull. 0.30 catches the same story reworded across outlets;
// the signature requirement is what stops it merging unrelated stories from the
// same beat. Two shared signature tokens rather than one: a single rare word in
// common is coincidence often enough to matter, two is a story. A shared figure
// counts double -- two headlines agreeing on "$34.8M" are describing one event.
const SIMILARITY_THRESHOLD = 0.30;
const MIN_SHARED_DISTINCTIVE = 2;

// Kept in step with briefService: a regulator's own notice is the record, not a
// report of it, and one is enough under the charter's primary-source rule.
const PRIMARY_SOURCE_TYPES = new Set(['government', 'press_release']);

/** Stable, readable cluster key from a seed signal. */
function buildClusterKey(signal, distinctive) {
    const distinct = [...(distinctive || [])].slice(0, 3);
    const content = [...contentTokens(signal.title)].slice(0, 3);
    const parts = (distinct.length ? distinct : content).sort();
    const day = signal.publishedAt ? new Date(signal.publishedAt).toISOString().slice(0, 10) : 'undated';
    const base = parts.join('-').replace(/[^a-z0-9-]/g, '').slice(0, 60) || 'story';
    return `${day}-${base}`;
}

/**
 * Clusters this website's accepted signals inside a time window.
 *
 * Greedy single-pass against cluster representatives rather than full pairwise:
 * a signal joins the first cluster it is close enough to. On a few hundred
 * headlines that is the right trade -- the ordering is by recency, so the story
 * that broke first seeds the cluster and later coverage attaches to it.
 */
async function clusterSignals(websiteId, { windowHours = 72, dryRun = false } = {}) {
    const since = new Date(Date.now() - windowHours * 3600 * 1000);

    const signals = await CmsStorySignal.findAll({
        where: {
            websiteId,
            decision: { [Op.in]: ['accepted', 'clustered'] },
            publishedAt: { [Op.gte]: since },
        },
        order: [['publishedAt', 'ASC']],
    });

    // Rarity is measured over EVERY signal in the window, not just the accepted
    // ones. Measuring it over the accepted subset alone is circular -- in a corpus
    // of thirty headlines, a token shared by exactly the two headlines under
    // comparison scores as rare *because* they share it. That merged "B. Braun
    // Issues Voluntary Nationwide Recall" with "American Regent Issues Voluntary
    // Nationwide Recall", two unrelated recalls, on boilerplate that is rare in
    // thirty headlines and thoroughly common in five hundred.
    const corpus = await CmsStorySignal.findAll({
        where: { websiteId, publishedAt: { [Op.gte]: since } },
        attributes: ['title'],
        raw: true,
    });

    const prepared = signals.map((signal) => ({
        signal,
        tokens: contentTokens(`${signal.title} ${signal.summary || ''}`),
        titleTokens: contentTokens(signal.title),
        figures: figureTokens(signal.title),
    }));
    const df = buildDocumentFrequency(corpus.map((c) => contentTokens(c.title)));
    const corpusSize = corpus.length;

    const clusters = [];
    for (const { signal, tokens, titleTokens, figures } of prepared) {
        const distinct = new Set([...signatureOf(titleTokens, df, corpusSize), ...figures]);

        let joined = null;
        let bestScore = 0;
        for (const cluster of clusters) {
            const score = jaccard(tokens, cluster.tokens);
            if (score < SIMILARITY_THRESHOLD) continue;
            // A shared figure is worth two ordinary signature hits.
            const sharedFigures = sharedCount(figures, cluster.figures);
            const evidence = sharedCount(distinct, cluster.distinct) + sharedFigures;
            if (evidence < MIN_SHARED_DISTINCTIVE) continue;
            if (score > bestScore) { bestScore = score; joined = cluster; }
        }

        if (joined) {
            joined.members.push(signal);
            // Widen the representative so later coverage using either outlet's
            // vocabulary still matches.
            for (const t of tokens) joined.tokens.add(t);
            for (const t of distinct) joined.distinct.add(t);
            for (const t of figures) joined.figures.add(t);
        } else {
            clusters.push({
                key: buildClusterKey(signal, distinct),
                tokens, distinct, figures: new Set(figures),
                members: [signal],
            });
        }
    }

    if (!dryRun) {
        for (const cluster of clusters) {
            for (const member of cluster.members) {
                if (member.clusterKey === cluster.key && member.decision === 'clustered') continue;
                await member.update({ clusterKey: cluster.key, decision: 'clustered' });
            }
        }
    }

    return clusters.map((c) => ({
        clusterKey: c.key,
        size: c.members.length,
        // Distinct outlets, not distinct articles: three wires republishing one
        // agency release is one source, and the charter's minimum counts sources.
        sourceCount: new Set(c.members.map((m) => m.sourceName).filter(Boolean)).size,
        // Whether the cluster rests on a document rather than a report of one.
        // briefService needs this to apply the charter's primary-source rule, and
        // sorting on it puts writable stories at the top of the queue.
        hasPrimarySource: c.members.some((m) => PRIMARY_SOURCE_TYPES.has(String(m.sourceType || ''))),
        sourceTypes: [...new Set(c.members.map((m) => m.sourceType).filter(Boolean))],
        topScore: Math.max(...c.members.map((m) => m.relevanceScore || 0)),
        titles: c.members.map((m) => m.title),
        members: c.members,
    })).sort((a, b) =>
        b.sourceCount - a.sourceCount ||
        Number(b.hasPrimarySource) - Number(a.hasPrimarySource) ||
        b.topScore - a.topScore);
}

module.exports = {
    clusterSignals, contentTokens, figureTokens, buildDocumentFrequency, signatureOf,
    jaccard, buildClusterKey,
    SIMILARITY_THRESHOLD, MIN_SHARED_DISTINCTIVE, SIGNATURE_SIZE, PRIMARY_SOURCE_TYPES,
};
