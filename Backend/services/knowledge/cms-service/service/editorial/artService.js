'use strict';

/**
 * Stage 4b — art. Every draft gets an owned illustration before it can publish.
 *
 * The publication policy requires original art, and until now nothing created
 * any, so `requireOriginalArt` refused every draft. This closes that with the
 * generator the CMS already uses for hand-written pieces (@baalvion/illustrations),
 * so a pipeline article and an editor's article carry the same house artwork.
 *
 * What this deliberately does NOT do is fetch a picture from the wire. A photo
 * lifted from a source is neither licensed nor ours, and a generated image that
 * claims to *show* a named person or a specific event is a fabrication — which
 * is why cms_article_art carries `depictsNamedSubject` and why this service
 * always writes it false. The illustration is a branded graphic derived from the
 * headline, and its caption says exactly that.
 */

const path = require('path');
const { writeArticleArtFile } = require('@baalvion/illustrations');
const { CmsArticleDraft, CmsArticleArt, CmsCategory } = require('../../models');
const { UPLOAD_DIR, PUBLIC_BASE } = require('../mediaService');
const { AppError } = require('../../utils/errors');
const { logger } = require('../../platform/logger');

const log = logger('editorial-art');

const GENERATED_ART_PREFIX = '/uploads/generated-art/';

/**
 * Alt text that describes the graphic, not the news.
 *
 * "Chart showing Canada's tariffs" would be a lie about an illustration that
 * charts nothing. Naming it as a branded graphic keeps the alt text true for a
 * screen-reader user, which is the only audience it has.
 */
function altTextFor(title, categoryName) {
    const beat = categoryName ? `${categoryName} ` : '';
    return `Illustrated ${beat}graphic for the article “${title}”`;
}

/**
 * Creates (or replaces) the primary illustration for one draft.
 *
 * Idempotent per draft: re-running replaces the row rather than accumulating
 * art, so a re-drafted story does not end up with three primaries.
 */
async function generateForDraft(websiteId, draftId) {
    const draft = await CmsArticleDraft.findOne({ where: { id: draftId, websiteId } });
    if (!draft) throw new AppError('NOT_FOUND', 'Draft not found', 404);
    if (draft.status === 'failed') {
        throw new AppError('DRAFT_FAILED', 'This draft never produced copy; there is nothing to illustrate.', 409);
    }

    const category = draft.categoryHint
        ? await CmsCategory.findOne({ where: { websiteId, slug: draft.categoryHint }, attributes: ['name'] })
        : null;
    const categoryName = category ? category.name : null;

    let url;
    try {
        // Seeded on the draft id: the same story always renders the same graphic,
        // so a re-run does not silently change the picture under a published page.
        writeArticleArtFile(
            {
                title: draft.title,
                category: categoryName,
                tags: [],
                excerpt: draft.dek || '',
                seed: draft.id,
            },
            path.join(UPLOAD_DIR, 'generated-art', `${draft.id}.svg`),
        );
        url = `${PUBLIC_BASE}${GENERATED_ART_PREFIX}${draft.id}.svg`;
    } catch (err) {
        // Recorded rather than thrown: the gate then refuses the draft for missing
        // art, which is the honest outcome and keeps the reason visible.
        const [row] = await CmsArticleArt.findOrCreate({
            where: { draftId: draft.id, isPrimary: true },
            defaults: { kind: 'illustration', provider: 'baalvion-illustrations' },
        });
        await row.update({ status: 'failed', failureReason: err.message });
        log.warn({ draftId, err: err.message }, 'art generation failed');
        return row;
    }

    const [row] = await CmsArticleArt.findOrCreate({
        where: { draftId: draft.id, isPrimary: true },
        defaults: { kind: 'illustration' },
    });

    await row.update({
        kind: 'illustration',
        provider: 'baalvion-illustrations',
        sourcePageUrl: null,
        sourceFileUrl: null,
        licenseName: 'Baalvion original',
        licenseUrl: null,
        attribution: 'Baalvion',
        subject: categoryName || 'editorial',
        // Never true for a generated image. The graphic depicts no real person
        // and no real scene, and asserting otherwise is the fabrication this
        // column exists to make auditable.
        depictsNamedSubject: false,
        altText: altTextFor(draft.title, categoryName),
        caption: 'Illustration: Baalvion',
        url,
        status: 'ready',
        failureReason: null,
        isPrimary: true,
    });

    log.info({ draftId, url }, 'art ready');
    return row;
}

/** Illustrates every drafted piece that has no usable primary art yet. */
async function runArt(websiteId, { limit = 20 } = {}) {
    const drafts = await CmsArticleDraft.findAll({
        where: { websiteId, status: 'drafted' },
        order: [['createdAt', 'DESC']],
        limit,
    });

    let created = 0;
    const results = [];
    for (const draft of drafts) {
        const existing = await CmsArticleArt.findOne({
            where: { draftId: draft.id, isPrimary: true, status: ['ready', 'approved'] },
        });
        if (existing) { results.push({ draftId: draft.id, status: 'already' }); continue; }
        try {
            const row = await generateForDraft(websiteId, draft.id);
            results.push({ draftId: draft.id, status: row.status });
            if (row.status === 'ready') created += 1;
        } catch (err) {
            results.push({ draftId: draft.id, status: 'error', error: err.message });
        }
    }
    return { considered: drafts.length, created, results };
}

module.exports = { generateForDraft, runArt, altTextFor, GENERATED_ART_PREFIX };
