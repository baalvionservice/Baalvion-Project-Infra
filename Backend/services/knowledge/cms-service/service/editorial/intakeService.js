'use strict';

/**
 * Stage 1 — intake. Scores every wire item against one site's charter and
 * records the verdict.
 *
 * The scorer is deterministic and explainable on purpose: every accepted or
 * rejected signal keeps the exact components that produced its number, so an
 * editor can see *why* a story was picked up or dropped and correct the charter
 * rather than argue with a black box. No model call happens at this stage --
 * scoring hundreds of headlines an hour through an LLM would cost real money to
 * answer a question that keyword fit, source tier, recency and substance already
 * answer well.
 */

const { Op } = require('sequelize');
const { CmsStorySignal } = require('../../models');
const charterService = require('./charterService');
const { fetchWire } = require('./wireClient');

// A story the desk has not picked up within a week is not news any more.
const MAX_AGE_HOURS = 168;
// Total out of 100. Tuned against a live wire pull: below this the matches are
// incidental word overlap rather than genuine beat fit.
const DEFAULT_ACCEPT_THRESHOLD = 45;
// Beat gate, applied before the total is considered.
//
// Source quality and freshness can strengthen a story that is already ours; they
// can never make an off-beat story ours. Without this gate the other components
// alone reach the accept threshold -- a live pull scored a NASA nebula photo 41
// for the LAW site, its reason line reading "No charter beat terms matched".
//
// A single term hit is the ambiguous case. "Huawei copies Samsung's privacy
// display" and "FDA issues nationwide recall" are both one on-charter word in a
// headline; what separates them is that one is a Technology item from a gadget
// site and the other a Legal item from a regulator. So a lone hit needs the wire
// category to corroborate it, and two independent hits stand on their own.
const MIN_DISTINCT_HITS_WITHOUT_CATEGORY = 2;

const NAMED_ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ldquo: '\u201c', rdquo: '\u201d', lsquo: '\u2018', rsquo: '\u2019',
    mdash: '\u2014', ndash: '\u2013', hellip: '\u2026',
};

/**
 * Wire titles arrive HTML-escaped from several publishers -- MarketWatch items
 * came through as "&#x2018;Poverty doesn&#x2019;t have to be my reality&#x2019;".
 * Left encoded, those entities end up in the signal list, in the brief, and in
 * anything drafted from them.
 */
function decodeEntities(input) {
    return String(input || '')
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
        .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

const lower = (s) => decodeEntities(s).toLowerCase();

/**
 * Light inflectional stemmer, applied to BOTH the charter term and the text.
 *
 * Stemming only the term is not enough and the direction matters: a charter
 * saying "settlement" against a headline saying "settle claims" is the case that
 * actually came up on a live pull, and it is the *term* that is longer there.
 * Reducing both sides to a common root handles it either way round.
 *
 * Order is significant -- 'ments' before 'ment' before 's'. The length guards
 * stop it mangling short words ('was' must not become 'wa', 'ring' not 'r').
 */
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

const stemTokens = (text) => (lower(text).match(/[a-z0-9]+/g) || []).map(stem);

/**
 * Whole-token phrase match over stemmed tokens.
 *
 * Token-sequence matching rather than substring: substring would fire "ai"
 * inside "said" and "chair", which is exactly the kind of false positive that
 * fills a finance site with science stories.
 */
function matchesTokens(textTokens, term) {
    const needle = stemTokens(term);
    if (!needle.length) return false;
    for (let i = 0; i + needle.length <= textTokens.length; i += 1) {
        let hit = true;
        for (let j = 0; j < needle.length; j += 1) {
            if (textTokens[i + j] !== needle[j]) { hit = false; break; }
        }
        if (hit) return true;
    }
    return false;
}

function hitTerms(haystack, terms = []) {
    const tokens = stemTokens(haystack);
    return terms.filter((t) => matchesTokens(tokens, t));
}

/**
 * 0-100 fit against the charter, plus the reasons that produced it.
 *
 * Components:
 *   beatFit     0-45  charter cover terms hit; a hit in the headline counts for
 *                     more than one buried in the summary
 *   catAffinity 0-15  the wire category is one this site actually covers
 *   sourceTier  0-10  a government/press-release source is the originating
 *                     document, not a report of one
 *   recency     0-15
 *   substance   0-15  a usable summary, concrete figures, named entities
 */
function scoreArticle(charter, article) {
    const title = decodeEntities(article.title);
    const summary = decodeEntities(article.summary_ai || article.summary_raw || '');
    const titleL = lower(title);
    const summaryL = lower(summary);
    const bothL = `${titleL} ${summaryL}`;
    const reasons = [];

    const excluded = hitTerms(bothL, charter.excludes || []);
    if (excluded.length) {
        return {
            score: 0,
            reasons: [{ component: 'excluded', points: 0, detail: `Charter excludes: ${excluded.join(', ')}` }],
            reject: 'excluded_topic',
        };
    }

    const ageHours = article.published_at
        ? (Date.now() - new Date(article.published_at).getTime()) / 3600000
        : Infinity;
    if (ageHours > MAX_AGE_HOURS) {
        return {
            score: 0,
            reasons: [{ component: 'recency', points: 0, detail: `Published ${Math.round(ageHours)}h ago` }],
            reject: 'too_old',
        };
    }

    const titleHits = hitTerms(titleL, charter.covers || []);
    const bodyHits = hitTerms(summaryL, charter.covers || []).filter((t) => !titleHits.includes(t));
    const beatFit = Math.min(45, titleHits.length * 12 + bodyHits.length * 5);
    reasons.push({
        component: 'beatFit',
        points: beatFit,
        detail: titleHits.length || bodyHits.length
            ? `Headline: ${titleHits.join(', ') || 'none'}${bodyHits.length ? ` | Summary: ${bodyHits.join(', ')}` : ''}`
            : 'No charter beat terms matched',
    });

    const wireCategories = charter.wireCategories || [];
    const onBeatCategory = wireCategories.length > 0 && wireCategories.includes(article.category);
    const catAffinity = onBeatCategory ? 15 : 0;
    reasons.push({
        component: 'catAffinity',
        points: catAffinity,
        detail: !wireCategories.length
            ? 'No wire categories set on the charter'
            : onBeatCategory ? `${article.category} is on this site's beat` : `${article.category} is off-beat`,
    });

    const sourceType = (article.source && article.source.type) || 'rss';
    const sourceTier = sourceType === 'government' || sourceType === 'press_release' ? 10 : 4;
    reasons.push({
        component: 'sourceTier',
        points: sourceTier,
        detail: sourceTier === 10 ? `Primary source (${sourceType})` : 'Secondary wire report',
    });

    const recency = ageHours <= 6 ? 15 : ageHours <= 24 ? 11 : ageHours <= 48 ? 6 : ageHours <= 96 ? 2 : 0;
    reasons.push({ component: 'recency', points: recency, detail: `${Math.round(ageHours)}h old` });

    let substance = 0;
    const substanceDetail = [];
    if (summary.length >= 400) { substance += 6; substanceDetail.push('full summary'); }
    else if (summary.length >= 150) { substance += 4; substanceDetail.push('short summary'); }
    // A figure is something a reader can check and a fact-checker can verify.
    if (/(\$|€|£|\d+(\.\d+)?\s?(%|percent|billion|million|bps|basis points))/i.test(`${title} ${summary}`)) {
        substance += 5; substanceDetail.push('concrete figures');
    }
    // Two or more proper-noun tokens in the headline: a story about someone or
    // something specific, rather than a roundup.
    const properNouns = (title.match(/\b[A-Z][a-zA-Z]{2,}\b/g) || []).filter((w) => !/^(The|This|That|How|Why|What|When|New|And|For|With)$/.test(w));
    if (properNouns.length >= 2) { substance += 4; substanceDetail.push('named entities'); }
    reasons.push({ component: 'substance', points: substance, detail: substanceDetail.join(', ') || 'thin' });

    const score = Math.min(100, beatFit + catAffinity + sourceTier + recency + substance);

    // Applied after scoring so the reasons still explain the near-miss, but before
    // any threshold comparison -- an off-beat story is never ours at any score.
    const distinctHits = titleHits.length + bodyHits.length;
    if (beatFit === 0) return { score, reasons, reject: 'off_beat' };
    if (distinctHits < MIN_DISTINCT_HITS_WITHOUT_CATEGORY && !onBeatCategory) {
        return { score, reasons, reject: 'weak_beat_fit' };
    }
    return { score, reasons, reject: null };
}

/**
 * Pulls the wire and records one scored signal per article for this website.
 *
 * Idempotent: (websiteId, url) is unique, so re-running only rescores. Rescoring
 * matters -- a charter edit should change past verdicts too, otherwise the queue
 * reflects a policy that no longer exists. Signals already promoted into a
 * cluster are left alone so an edit cannot rewrite a story already in progress.
 */
async function runIntake(websiteId, { limit = 200, sinceHours = 72, acceptThreshold = DEFAULT_ACCEPT_THRESHOLD } = {}) {
    const charter = await charterService.requireCharter(websiteId);
    const { articles, error } = await fetchWire({ limit, sinceHours });

    let created = 0;
    let rescored = 0;
    let accepted = 0;
    let rejected = 0;

    for (const article of articles) {
        if (!article.title || !article.url) continue;
        const { score, reasons, reject } = scoreArticle(charter, article);
        const decision = reject ? 'rejected' : score >= acceptThreshold ? 'accepted' : 'rejected';
        const rejectionReason = reject || (decision === 'rejected' ? `below_threshold (${score}/${acceptThreshold})` : null);

        const existing = await CmsStorySignal.findOne({ where: { websiteId, url: article.url } });
        if (existing) {
            if (existing.decision === 'clustered') continue;
            // Title/summary are rewritten too, not just the verdict: a row stored
            // before a decoder or normalizer change would otherwise keep its old
            // text forever (HTML-escaped MarketWatch headlines were doing exactly
            // that after entity decoding was added).
            await existing.update({
                title: decodeEntities(article.title),
                summary: decodeEntities(article.summary_ai || article.summary_raw || '') || null,
                sourceType: (article.source && article.source.type) || existing.sourceType,
                relevanceScore: score, scoreReasons: reasons, decision, rejectionReason,
            });
            rescored += 1;
        } else {
            await CmsStorySignal.create({
                websiteId,
                wireArticleId: article.id || null,
                title: decodeEntities(article.title),
                url: article.url,
                sourceName: (article.source && article.source.name) || null,
                sourceType: (article.source && article.source.type) || null,
                publishedAt: article.published_at || null,
                wireCategory: article.category || null,
                country: article.country || null,
                summary: decodeEntities(article.summary_ai || article.summary_raw || '') || null,
                relevanceScore: score,
                scoreReasons: reasons,
                decision,
                rejectionReason,
            });
            created += 1;
        }
        if (decision === 'accepted') accepted += 1; else rejected += 1;
    }

    return { scanned: articles.length, created, rescored, accepted, rejected, wireError: error };
}

/** Accepted signals not yet gathered into a cluster, newest first. */
async function listAccepted(websiteId, { sinceHours = 72, limit = 500 } = {}) {
    return CmsStorySignal.findAll({
        where: {
            websiteId,
            decision: 'accepted',
            publishedAt: { [Op.gte]: new Date(Date.now() - sinceHours * 3600 * 1000) },
        },
        order: [['relevanceScore', 'DESC'], ['publishedAt', 'DESC']],
        limit,
    });
}

module.exports = { runIntake, scoreArticle, listAccepted, decodeEntities, MAX_AGE_HOURS, DEFAULT_ACCEPT_THRESHOLD, MIN_DISTINCT_HITS_WITHOUT_CATEGORY };
