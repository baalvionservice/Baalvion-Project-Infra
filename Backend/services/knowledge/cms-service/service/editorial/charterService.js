'use strict';

/**
 * The editorial charter — one per website — is the pipeline's only definition of
 * "who we are". Intake scores against it, the brief takes its angle from it, the
 * drafter writes to its voice and stance rules, and the gates enforce its
 * thresholds. Change the charter and every later stage changes with it.
 *
 * There is deliberately no built-in default charter. A site whose charter has
 * not been written yet produces no signals and no drafts, rather than quietly
 * running on a generic one and producing generic copy — which is the failure
 * this whole subsystem exists to prevent.
 */

const { CmsEditorialCharter, CmsWebsite } = require('../../models');
const { AppError } = require('../../utils/errors');

// Fields an editor may set. Anything else on the row (id, timestamps, the
// audit columns) is owned by the service.
const EDITABLE = [
    'niche', 'audience', 'houseAngle', 'voice', 'outputContentType',
    'covers', 'wireCategories', 'excludes', 'stanceRules', 'bannedClaims', 'requiredSections',
    'minSources', 'singlePrimarySourceOk', 'maxSimilarityPct', 'minCitationCoveragePct',
    'requireQuoteVerification', 'status',
];

// Floors, not preferences. An editor can make the pipeline stricter than these
// but not looser: below two sources a "story" is one outlet's copy, and a
// similarity ceiling above ~35% describes a paraphrase rather than a rewrite.
const LIMITS = {
    minSources: { min: 2, max: 10 },
    maxSimilarityPct: { min: 5, max: 35 },
    minCitationCoveragePct: { min: 50, max: 100 },
};

const asArray = (v) => (Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean) : []);

function clampNumeric(field, value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const { min, max } = LIMITS[field];
    return Math.min(max, Math.max(min, Math.round(n)));
}

async function getCharter(websiteId) {
    return CmsEditorialCharter.findOne({ where: { websiteId } });
}

/** Charter or a 409 — used by every stage that cannot meaningfully run without one. */
async function requireCharter(websiteId) {
    const charter = await getCharter(websiteId);
    if (!charter) {
        throw new AppError(
            'CHARTER_MISSING',
            'This website has no editorial charter yet. Write one before running the pipeline: without it there is no definition of the site\'s beat, angle or integrity thresholds.',
            409
        );
    }
    if (charter.status !== 'active') {
        throw new AppError('CHARTER_INACTIVE', 'This website\'s editorial charter is inactive.', 409);
    }
    return charter;
}

async function upsertCharter(websiteId, patch = {}, userId = null) {
    const website = await CmsWebsite.findByPk(websiteId);
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const clean = {};
    for (const key of EDITABLE) {
        if (!(key in patch)) continue;
        if (['covers', 'wireCategories', 'excludes', 'stanceRules', 'bannedClaims', 'requiredSections'].includes(key)) {
            clean[key] = asArray(patch[key]);
        } else if (key in LIMITS) {
            clean[key] = clampNumeric(key, patch[key], undefined);
        } else if (key === 'requireQuoteVerification' || key === 'singlePrimarySourceOk') {
            clean[key] = Boolean(patch[key]);
        } else {
            clean[key] = patch[key] == null ? null : String(patch[key]).trim();
        }
    }

    const existing = await getCharter(websiteId);
    if (existing) {
        await existing.update({ ...clean, updatedBy: userId });
        return existing.reload();
    }

    for (const required of ['niche', 'audience', 'houseAngle']) {
        if (!clean[required]) {
            throw new AppError('VALIDATION_ERROR', `charter.${required} is required`, 400);
        }
    }

    return CmsEditorialCharter.create({
        websiteId,
        minSources: 2,
        maxSimilarityPct: 18,
        minCitationCoveragePct: 70,
        requireQuoteVerification: true,
        ...clean,
        createdBy: userId,
        updatedBy: userId,
    });
}

module.exports = { getCharter, requireCharter, upsertCharter, EDITABLE, LIMITS };
