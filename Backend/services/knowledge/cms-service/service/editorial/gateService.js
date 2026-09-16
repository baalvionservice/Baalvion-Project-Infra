'use strict';

/**
 * Stage 5 — the gates, and the only path from a draft to a published article.
 *
 * Two rule sets meet here. The charter governs the writing (sourcing,
 * similarity, citation coverage, banned claims, section skeleton, quotes); the
 * publication policy governs the publishing (length, reviewer, art, cadence,
 * windows, live routes). policyService.evaluatePublish already implements the
 * second set — this module implements the first and runs both together, so
 * there is exactly one answer to "may this go out".
 *
 * Fail-closed throughout: anything that cannot be evaluated is a violation, not
 * a pass. A draft is published only through `approveDraft`, which re-runs the
 * gates at the moment of approval rather than trusting a stored verdict — the
 * cadence gates in particular are true only for the instant they were measured.
 */

const { CmsArticleDraft, CmsStoryBrief, CmsArticleArt, CmsCategory, CmsStorySignal } = require('../../models');
const charterService = require('./charterService');
const policyService = require('./policyService');
const contentService = require('../contentService');
const metrics = require('./textMetrics');
const { AppError } = require('../../utils/errors');
const { logger } = require('../../platform/logger');

const log = logger('editorial-gate');

/**
 * A story resting on one primary document must be more thoroughly cited than one
 * two outlets agree on, because there is no second account to catch a
 * misreading. Ten points on top of the charter floor, never above 100.
 */
const VERIFIED_PRIMARY_COVERAGE_BONUS = 10;

const violation = (rule, message) => ({ rule, status: 'failed', message });
const pass = (rule, message) => ({ rule, status: 'passed', message });

/** Quoted spans in the body, straight and curly. */
function quotedSpans(text) {
    return (String(text || '').match(/["“]([^"”]{12,400})["”]/g) || [])
        .map((q) => metrics.plainText(q).replace(/^["“]|["”]$/g, '').trim())
        .filter(Boolean);
}

/**
 * The charter half of the gate. Pure over its inputs so it can be reasoned about
 * and tested without a database.
 */
function evaluateCharterGates(charter, brief, draft) {
    const results = [];

    const bodyText = metrics.blocksToText(draft.contentBlocks);
    const fullText = [draft.title, draft.dek, bodyText].filter(Boolean).join(' ');

    // 1 — sourcing.
    const outlets = new Set((brief.sources || []).map((s) => s.name).filter(Boolean));
    const required = Number(charter.minSources) || 2;
    if (brief.sourcingBasis === 'verified_primary') {
        const primary = (brief.sources || []).find((s) => s.isPrimary);
        if (!charter.singlePrimarySourceOk) {
            results.push(violation('minSources', 'This brief was built under the primary-document exception, which the charter has since switched off. Re-source it or re-enable the exception.'));
        } else if (!primary) {
            results.push(violation('minSources', 'Recorded as verified_primary but no primary source is attached to the brief.'));
        } else {
            results.push(pass('minSources', `Verified primary: ${primary.name}. One document is sufficient under the charter's primary-source rule.`));
        }
    } else if (outlets.size >= required) {
        results.push(pass('minSources', `${outlets.size} independent outlets (charter requires ${required}).`));
    } else {
        results.push(violation('minSources', `${outlets.size} outlet(s); the charter requires ${required} and this story does not qualify as a primary document.`));
    }

    // 2 — similarity.
    const similarity = Number(draft.similarityPct);
    const maxSimilarity = Number(charter.maxSimilarityPct);
    if (!Number.isFinite(similarity)) {
        results.push(violation('maxSimilarity', 'Similarity was never measured on this draft. Re-run drafting.'));
    } else if (similarity > maxSimilarity) {
        results.push(violation('maxSimilarity', `${similarity}% of the draft is lifted from its sources; the charter caps this at ${maxSimilarity}%.`));
    } else {
        results.push(pass('maxSimilarity', `${similarity}% overlap with sources (ceiling ${maxSimilarity}%).`));
    }

    // 3 — citation coverage.
    const coverage = Number(draft.citationCoveragePct);
    const floor = Math.min(100, Number(charter.minCitationCoveragePct) +
        (brief.sourcingBasis === 'verified_primary' ? VERIFIED_PRIMARY_COVERAGE_BONUS : 0));
    if (!Number.isFinite(coverage)) {
        results.push(violation('citationCoverage', 'Citation coverage was never measured on this draft. Re-run drafting.'));
    } else if (coverage < floor) {
        results.push(violation('citationCoverage', `${coverage}% of checkable claims carry a citation; this story needs ${floor}%${floor !== Number(charter.minCitationCoveragePct) ? ' (raised because it rests on a single primary document)' : ''}.`));
    } else {
        results.push(pass('citationCoverage', `${coverage}% of checkable claims cited (floor ${floor}%).`));
    }

    // 4 — banned claims.
    const hits = metrics.bannedClaimHits(fullText, charter.bannedClaims);
    results.push(hits.length
        ? violation('bannedClaims', `Contains phrases the charter forbids: ${hits.map((h) => `"${h}"`).join(', ')}.`)
        : pass('bannedClaims', `None of the ${(charter.bannedClaims || []).length} banned phrases appear.`));

    // 5 — section skeleton.
    const headings = (draft.contentBlocks || [])
        .filter((b) => b && b.type === 'heading')
        .map((b) => (b.content && b.content.text) || '');
    const missing = metrics.missingSections(headings, charter.requiredSections);
    results.push(missing.length
        ? violation('requiredSections', `Missing required section(s): ${missing.join(', ')}.`)
        : pass('requiredSections', `All ${(charter.requiredSections || []).length} required sections present.`));

    // 6 — quote verification.
    if (charter.requireQuoteVerification) {
        const briefQuotes = (brief.quotes || []).map((q) => metrics.plainText(q.text).toLowerCase());
        const unverified = quotedSpans(bodyText).filter((span) => {
            const needle = span.toLowerCase();
            return !briefQuotes.some((bq) => bq.includes(needle) || needle.includes(bq));
        });
        results.push(unverified.length
            ? violation('quoteVerification', `${unverified.length} quotation(s) do not appear in the brief's verbatim quotes: "${unverified[0].slice(0, 80)}…".`)
            : pass('quoteVerification', 'Every quotation traces to a verbatim quote on the brief.'));
    }

    return results;
}


/**
 * Wire country code to the site's region category.
 *
 * Imperialpedia's /world page prioritises content filed under the region's own
 * category (`fetchCmsItems` asks for categorySlug=<region> first), so a news item
 * that never carries one is only ever reachable through the general feed. The map
 * is deliberately explicit and short: an unlisted country returns null and the
 * piece is filed on its topic alone, which is the honest outcome — guessing a
 * region from a two-letter code we have not accounted for puts stories on the
 * wrong continent.
 */
const REGION_BY_COUNTRY = {
    US: 'us',
    // 'EU' is not ISO-3166 but is what the ECB and Commission feeds are filed
    // under -- they speak for the bloc, not a member state.
    EU: 'europe',
    GB: 'europe', UK: 'europe', IE: 'europe', DE: 'europe', FR: 'europe', IT: 'europe',
    ES: 'europe', NL: 'europe', BE: 'europe', CH: 'europe', AT: 'europe', SE: 'europe',
    NO: 'europe', DK: 'europe', FI: 'europe', PL: 'europe', PT: 'europe', GR: 'europe',
    CN: 'china', HK: 'china', TW: 'china',
    JP: 'asia', KR: 'asia', IN: 'asia', SG: 'asia', AU: 'asia', NZ: 'asia',
    MY: 'asia', TH: 'asia', PH: 'asia', VN: 'asia',
    BR: 'emerging', MX: 'emerging', AR: 'emerging', CL: 'emerging', CO: 'emerging',
    ZA: 'emerging', NG: 'emerging', KE: 'emerging', EG: 'emerging', TR: 'emerging',
    ID: 'emerging', SA: 'emerging', AE: 'emerging', QA: 'emerging',
};

/**
 * The region category for a story, from the countries its signals carried.
 *
 * Takes the modal country rather than the first: a cluster of five US filings and
 * one UK reaction is a US story. Returns null when the signals disagree with no
 * clear winner, or when nothing maps.
 */
async function regionCategoryFor(websiteId, clusterKey) {
    if (!clusterKey) return null;
    const signals = await CmsStorySignal.findAll({
        where: { websiteId, clusterKey },
        attributes: ['country'],
        raw: true,
    });

    const tally = new Map();
    for (const s of signals) {
        const region = REGION_BY_COUNTRY[String(s.country || '').toUpperCase()];
        if (region) tally.set(region, (tally.get(region) || 0) + 1);
    }
    if (!tally.size) return null;

    const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
    if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return null;

    return CmsCategory.findOne({ where: { websiteId, slug: ranked[0][0] } });
}

/** Art rows that actually count: attached, usable, and marked primary. */
async function primaryArt(draftId) {
    return CmsArticleArt.findOne({ where: { draftId, isPrimary: true, status: ['ready', 'approved'] } });
}

/**
 * The full nine-gate evaluation for one draft, persisted onto the row.
 *
 * `reviewerSlug` is passed in rather than read from the draft because the
 * reviewer is whoever is looking at it now — the reviewer-distinct check has to
 * run against the person about to approve, not a value stored earlier.
 */
async function evaluateDraft(websiteId, draftId, { reviewerSlug = null, at = new Date() } = {}) {
    const charter = await charterService.requireCharter(websiteId);
    const draft = await CmsArticleDraft.findOne({ where: { id: draftId, websiteId } });
    if (!draft) throw new AppError('NOT_FOUND', 'Draft not found', 404);

    const brief = await CmsStoryBrief.findByPk(draft.briefId);
    if (!brief) throw new AppError('BRIEF_MISSING', 'The brief this draft was written from no longer exists; the sourcing gates cannot be evaluated.', 409);

    const results = evaluateCharterGates(charter, brief, draft);

    const art = await primaryArt(draft.id);
    const policyVerdict = await policyService.evaluatePublish(websiteId, {
        categorySlug: draft.categoryHint,
        authorSlug: draft.authorSlug,
        reviewerSlug: reviewerSlug || draft.reviewerSlug,
        contentBlocks: draft.contentBlocks,
        format: 'news',
        hasOriginalArt: Boolean(art),
        outputContentType: charter.outputContentType,
        at,
    });

    for (const v of policyVerdict.violations) results.push(violation(v.rule, v.message));

    // Policy rules that did not fire are still gates that were checked, and the
    // reviewer needs to see them as such rather than as silence.
    const firedRules = new Set(policyVerdict.violations.map((v) => v.rule));
    for (const [rule, message] of [
        ['wordCount', `${policyVerdict.words} words, inside the budget for news.`],
        ['reviewerDistinct', 'Reviewer differs from the byline.'],
        ['requireOriginalArt', art ? 'Original art attached.' : 'Art not required by policy.'],
        ['rateLimits', 'Inside the daily ceiling, hourly cap and minimum spacing.'],
        ['publishWindow', 'Inside a configured publishing window.'],
    ]) {
        const covers = rule === 'rateLimits'
            ? ['dailyMax', 'hourlyMax', 'minMinutesBetweenPosts', 'categoryMaxPerDay', 'maxArticlesPerAuthorPerDay']
            : [rule === 'wordCount' ? 'wordCountMin' : rule];
        const alsoCovers = rule === 'wordCount' ? ['wordCountMax'] : [];
        if (![...covers, ...alsoCovers].some((r) => firedRules.has(r))) results.push(pass(rule, message));
    }

    const failed = results.filter((r) => r.status === 'failed');
    const gateStatus = failed.length ? 'failed' : 'passed';

    await draft.update({
        gateStatus,
        gateResults: results,
        reviewerSlug: reviewerSlug || draft.reviewerSlug,
    });

    log.info({ draftId, gateStatus, failed: failed.length }, 'gates evaluated');
    return {
        draftId, gateStatus, allowed: gateStatus === 'passed',
        results, failedCount: failed.length,
        warnings: policyVerdict.warnings,
        words: policyVerdict.words,
    };
}

/**
 * Approves a draft and publishes it.
 *
 * The gates run again here, at approval time, and a failure refuses the publish
 * — a verdict recorded an hour ago says nothing about whether the site is inside
 * its publishing window now, or whether three other pieces have gone out since.
 */
async function approveDraft(websiteId, draftId, userId, { reviewerSlug = null, overrideNotes = null } = {}) {
    const verdict = await evaluateDraft(websiteId, draftId, { reviewerSlug });
    if (!verdict.allowed) {
        throw new AppError(
            'GATES_FAILED',
            `${verdict.failedCount} gate(s) refuse this draft: ${verdict.results.filter((r) => r.status === 'failed').map((r) => r.rule).join(', ')}.`,
            409,
            { results: verdict.results }
        );
    }

    const draft = await CmsArticleDraft.findOne({ where: { id: draftId, websiteId } });
    if (draft.cmsContentId) throw new AppError('ALREADY_PUBLISHED', 'This draft has already been published.', 409);

    const charter = await charterService.requireCharter(websiteId);
    const brief = await CmsStoryBrief.findByPk(draft.briefId);

    const category = draft.categoryHint
        ? await CmsCategory.findOne({ where: { websiteId, slug: draft.categoryHint } })
        : null;

    // The topic category stays primary -- it decides the /world rail the piece is
    // rendered under. The region rides alongside it so the region page picks the
    // story up, which is the only thing that puts pipeline output on /world/<region>.
    const region = brief ? await regionCategoryFor(websiteId, brief.clusterKey) : null;
    const categoryIds = [category, region].filter(Boolean).map((c) => c.id);

    const art = await primaryArt(draft.id);

    const created = await contentService.createContent(websiteId, userId, {
        title: draft.title,
        slug: draft.slug,
        excerpt: draft.dek,
        categoryId: category ? category.id : null,
        categoryIds,
        contentType: charter.outputContentType,
        contentBlocks: draft.contentBlocks,
        seoMetadata: draft.seoMetadata || {},
        featuredImage: art ? art.url : null,
        visibility: 'public',
        // The byline lives in customFields.authorSlug — policyService reads it
        // from there when counting a contributor's pieces for the day.
        customFields: {
            authorSlug: draft.authorSlug,
            editorialDraftId: draft.id,
            editorialBriefId: draft.briefId,
            sourcingBasis: brief ? brief.sourcingBasis : null,
            regionSlug: region ? region.slug : null,
            citations: draft.citations || [],
        },
        externalSourceName: brief && brief.sources && brief.sources[0] ? brief.sources[0].name : null,
        externalSourceUrl: brief && brief.sources && brief.sources[0] ? brief.sources[0].url : null,
    });

    // publishedAt is set explicitly: nothing else writes it, and every cadence
    // gate counts on it. A published row without it is invisible to the ceilings.
    await contentService.updateContent(websiteId, created.id, userId, {
        status: 'published',
        publishedAt: new Date(),
    });

    await draft.update({
        status: 'published',
        cmsContentId: created.id,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewerSlug: reviewerSlug || draft.reviewerSlug,
        reviewNotes: overrideNotes || draft.reviewNotes,
    });

    log.info({ draftId, contentId: created.id }, 'draft published');
    return { draftId, contentId: created.id, slug: created.slug, gateResults: verdict.results };
}

/** Declines a draft. Kept rather than deleted — a rejected story is a record. */
async function rejectDraft(websiteId, draftId, userId, { notes = null } = {}) {
    const draft = await CmsArticleDraft.findOne({ where: { id: draftId, websiteId } });
    if (!draft) throw new AppError('NOT_FOUND', 'Draft not found', 404);
    await draft.update({ status: 'rejected', reviewedBy: userId, reviewedAt: new Date(), reviewNotes: notes });
    return draft;
}

module.exports = {
    evaluateDraft, evaluateCharterGates, approveDraft, rejectDraft,
    quotedSpans, primaryArt, regionCategoryFor,
    VERIFIED_PRIMARY_COVERAGE_BONUS, REGION_BY_COUNTRY,
};
