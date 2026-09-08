'use strict';

/**
 * Stage 4 — drafting. The brief plus the charter become an article in this
 * site's voice.
 *
 * The charter is injected as instruction AND enforced as measurement afterwards.
 * Both are needed: telling a model not to write "guaranteed returns" works most
 * of the time, and the times it does not are exactly the ones that must never
 * reach a reader. So the banned list goes into the prompt to shape the draft,
 * and `textMetrics.bannedClaimHits` checks the output regardless.
 *
 * Drafts land in cms_article_drafts, never in cms_contents. Nothing here is
 * reachable by the public API until a human approves it in stage 5.
 */

const { CmsArticleDraft, CmsStoryBrief, CmsCategory } = require('../../models');
const charterService = require('./charterService');
const policyService = require('./policyService');
const llmClient = require('./llmClient');
const metrics = require('./textMetrics');
const { slugify } = require('../../utils/slugify');
const { AppError } = require('../../utils/errors');
const { logger } = require('../../platform/logger');

const log = logger('editorial-draft');

const DRAFT_SCHEMA = {
    type: 'OBJECT',
    properties: {
        title: { type: 'STRING' },
        dek: { type: 'STRING' },
        sections: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    heading: { type: 'STRING' },
                    paragraphs: { type: 'ARRAY', items: { type: 'STRING' } },
                },
                required: ['heading', 'paragraphs'],
            },
        },
        citations: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    claim: { type: 'STRING' },
                    sourceUrl: { type: 'STRING' },
                    sourceName: { type: 'STRING' },
                },
                required: ['claim', 'sourceUrl'],
            },
        },
        seoTitle: { type: 'STRING' },
        seoDescription: { type: 'STRING' },
        categoryHint: { type: 'STRING' },
    },
    required: ['title', 'sections', 'citations'],
};

/** The word budget for this format, from the publication policy. */
function wordBudget(policy, format) {
    const rule = (Array.isArray(policy.wordCountRules) ? policy.wordCountRules : []).find((r) => r.format === format);
    return { min: Number(rule && rule.min) || 350, max: Number(rule && rule.max) || 1600 };
}

/**
 * The system instruction: who this publication is, and the rules it will not
 * break. Written as prose rather than a bullet list of constraints because the
 * charter's `voice` field is prose, and the two have to read as one instruction.
 */
function buildSystemPrompt(charter, budget, sectionCount = 0) {
    const lines = [
        `You write for: ${charter.niche}`,
        `Your readers are: ${charter.audience}`,
        '',
        `HOUSE ANGLE — every piece is written through this: ${charter.houseAngle}`,
    ];
    if (charter.voice) lines.push('', `VOICE: ${charter.voice}`);

    if ((charter.stanceRules || []).length) {
        lines.push('', 'STANCE RULES — these are absolute:');
        for (const rule of charter.stanceRules) lines.push(`- ${rule}`);
    }

    if ((charter.bannedClaims || []).length) {
        lines.push(
            '',
            'NEVER write any of the following phrases, in any grammatical form. They are',
            'checked against your output after generation and a hit blocks publication:',
            charter.bannedClaims.map((c) => `"${c}"`).join(', ')
        );
    }

    // A range alone gets undershot: the first live draft came back at 248 words
    // against a 350-750 budget and the gate refused it. Naming a single target,
    // giving the per-section arithmetic, and saying plainly that a short piece is
    // rejected turns the budget from a hint into an instruction the model can
    // actually plan against.
    const target = Math.round(budget.min + (budget.max - budget.min) * 0.45);
    const perSection = sectionCount ? Math.round(target / sectionCount) : target;

    lines.push(
        '',
        `LENGTH — this is a hard requirement, not a guide. Aim for ${target} words in total;`,
        `anything under ${budget.min} or over ${budget.max} is rejected and never reaches a reader.`,
        sectionCount
            ? `You have ${sectionCount} required sections, so budget roughly ${perSection} words each — about ${Math.max(2, Math.round(perSection / 45))} substantial paragraphs per section.`
            : 'Plan the length across your sections before you start writing.',
        'Reach the target by explaining the mechanism more fully, defining the terms a',
        'reader will not know, and setting out what would have to be true for the story',
        'to change — never by repeating a point already made or padding with filler.',
        '',
        'SOURCING: you are given a brief whose every fact carries a source URL. Write only',
        'what those facts support. Do not add background from your own knowledge, do not',
        'estimate, and do not convert an absence of evidence into a hedged claim. Every',
        'sentence containing a figure, a currency amount, or a quotation must appear in',
        'your citations list against the URL that supports it.',
        '',
        'CITATIONS map to sentences AS YOU WROTE THEM, not to deduplicated claims. If you',
        'state the same figure in two sections, both sentences need an entry — copy the',
        'sentence into `claim` and repeat the same sourceUrl. A checkable sentence with no',
        'matching entry counts as uncited, and a draft below the charter\'s coverage floor',
        'is refused.'
    );

    return lines.join('\n');
}

function buildUserPrompt(charter, brief) {
    const facts = (brief.facts || [])
        .map((f, i) => `${i + 1}. ${f.statement}${f.figure ? ` [figure: ${f.figure}]` : ''}\n   source: ${f.sourceUrl}`)
        .join('\n');

    const quotes = (brief.quotes || []).length
        ? (brief.quotes || []).map((q) => `- "${q.text}" — ${q.speaker || 'unattributed'} (${q.sourceUrl})`).join('\n')
        : '(none — do not invent any)';

    const disputed = (brief.disputed || []).length
        ? (brief.disputed || []).map((d) => `- ${d.claim}: ${(d.readings || []).join(' / ')}`).join('\n')
        : '(nothing contested)';

    const sections = (charter.requiredSections || []).length
        ? charter.requiredSections.map((s, i) => `${i + 1}. ${s}`).join('\n')
        : '(use your own structure)';

    return [
        `WORKING TITLE: ${brief.workingTitle}`,
        `ANGLE: ${brief.angle || '(none recorded)'}`,
        `WHY IT MATTERS: ${brief.whyItMatters || '(none recorded)'}`,
        '',
        brief.sourcingBasis === 'verified_primary'
            ? 'SOURCING NOTE: this story rests on ONE primary document. Attribute by name in the sentence that carries each fact, and do not imply corroboration that does not exist.'
            : 'SOURCING NOTE: multiple independent outlets support this story.',
        '',
        'VERIFIED FACTS — you may write nothing that these do not support:',
        facts,
        '',
        'VERBATIM QUOTES (use exactly, or not at all):',
        quotes,
        '',
        'CONTESTED:',
        disputed,
        '',
        'REQUIRED SECTIONS — use these headings, in this order, all of them:',
        sections,
        '',
        'Return the article as sections of paragraphs, plus a citations list mapping each',
        'checkable claim to the source URL that backs it.',
    ].join('\n');
}

/** Sections become CMS blocks in the shape the editor and renderer already use. */
function sectionsToBlocks(sections = []) {
    const blocks = [];
    let order = 0;
    const push = (type, content) => { blocks.push({ id: `blk-${order}`, type, order, content }); order += 1; };

    for (const section of sections) {
        if (section && section.heading) push('heading', { text: String(section.heading).trim(), level: 2 });
        for (const para of (section && section.paragraphs) || []) {
            const text = String(para || '').trim();
            if (text) push('html', { html: `<p>${escapeHtml(text)}</p>` });
        }
    }
    return blocks;
}

const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Best-effort category match, so the draft arrives on a beat rather than unfiled. */
async function resolveCategory(websiteId, hint, policy) {
    const categories = await CmsCategory.findAll({ where: { websiteId }, attributes: ['id', 'slug', 'name'], raw: true });
    if (!categories.length) return null;

    const dead = new Set((policy && policy.deadCategorySlugs) || []);
    const mixSlugs = new Set(((policy && policy.categoryMix) || []).map((m) => m.categorySlug));
    const wanted = metrics.plainText(hint || '').toLowerCase();

    // Only categories the policy actually publishes into, and only live routes.
    const candidates = categories.filter((c) => mixSlugs.has(c.slug) && !dead.has(c.slug));
    const pool = candidates.length ? candidates : categories.filter((c) => !dead.has(c.slug));

    const exact = pool.find((c) => c.slug === wanted || c.name.toLowerCase() === wanted);
    if (exact) return exact;
    const partial = wanted && pool.find((c) => wanted.includes(c.slug) || wanted.includes(c.name.toLowerCase()));
    return partial || pool[0] || null;
}

/**
 * Writes one draft from one brief.
 *
 * Metrics are computed and stored here; the thresholds they are judged against
 * live in the charter and are applied in stage 5. Keeping them apart means an
 * editor can tighten a threshold and re-gate existing drafts without paying for
 * a second generation.
 */
async function buildDraft(websiteId, briefId, { format = 'news', authorSlug = null } = {}) {
    const charter = await charterService.requireCharter(websiteId);
    const policy = await policyService.requirePolicy(websiteId);

    const brief = await CmsStoryBrief.findOne({ where: { id: briefId, websiteId } });
    if (!brief) throw new AppError('NOT_FOUND', 'Brief not found', 404);
    if (brief.status !== 'ready') {
        throw new AppError('BRIEF_NOT_READY', `Brief is "${brief.status}", not ready to draft: ${brief.failureReason || 'no reason recorded'}`, 409);
    }

    const budget = wordBudget(policy, format);

    // A brief with two facts cannot honestly fill 350 words: the first attempt at
    // exactly that produced four sections restating the same two facts, seven
    // "checkable" sentences and two citations. Padding a thin story to reach a
    // budget is the failure this pipeline exists to prevent, so the story is held
    // instead -- it is short of reporting, not short of words, and the fix is
    // another source rather than more prose.
    const minFacts = Math.max(2, Math.ceil(budget.min / 150));
    const factCount = (brief.facts || []).length;
    if (factCount < minFacts) {
        const reason = `Only ${factCount} verified fact(s); ${budget.min} words needs at least ${minFacts}. Held rather than padded — this story needs more reporting, not more prose.`;
        log.info({ briefId, factCount, minFacts }, 'brief too thin for its word budget');
        return CmsArticleDraft.create({
            websiteId, briefId, title: brief.workingTitle,
            status: 'failed', gateStatus: 'pending', failureReason: reason,
        });
    }

    let data;
    let model;
    try {
        ({ data, model } = await llmClient.generateJson(websiteId, {
            system: buildSystemPrompt(charter, budget, (charter.requiredSections || []).length),
            prompt: buildUserPrompt(charter, brief),
            schema: DRAFT_SCHEMA,
            temperature: 0.45,
            maxOutputTokens: 6144,
        }));
    } catch (err) {
        log.warn({ briefId, err: err.message }, 'draft generation failed');
        return CmsArticleDraft.create({
            websiteId, briefId, title: brief.workingTitle,
            status: 'failed', gateStatus: 'pending', failureReason: err.message,
        });
    }

    const contentBlocks = sectionsToBlocks(data.sections);
    const bodyText = metrics.blocksToText(contentBlocks);

    // A citation pointing anywhere but this brief's own sources is fabricated.
    const knownUrls = new Set((brief.sources || []).map((s) => s.url));
    const citations = (data.citations || []).filter((c) => c && c.sourceUrl && knownUrls.has(c.sourceUrl));

    const sourceTexts = (brief.facts || []).map((f) => f.statement)
        .concat((brief.sources || []).map((s) => s.name || ''));

    const category = await resolveCategory(websiteId, data.categoryHint, policy);

    const draft = await CmsArticleDraft.create({
        websiteId,
        briefId,
        title: String(data.title || brief.workingTitle).trim(),
        dek: data.dek ? String(data.dek).trim() : null,
        slug: slugify(String(data.title || brief.workingTitle)),
        contentBlocks,
        citations,
        seoMetadata: {
            title: data.seoTitle || data.title || null,
            description: data.seoDescription || data.dek || null,
        },
        authorSlug,
        categoryHint: category ? category.slug : (data.categoryHint || null),
        similarityPct: metrics.similarityPct(bodyText, sourceTexts),
        citationCoveragePct: metrics.citationCoveragePct(bodyText, citations),
        status: 'drafted',
        gateStatus: 'pending',
        modelUsed: model,
    });

    log.info({
        draftId: draft.id, briefId, model,
        words: policyService.countWords(contentBlocks),
        similarity: draft.similarityPct,
        coverage: draft.citationCoveragePct,
    }, 'draft written');

    return draft;
}

/**
 * Drafts the ready briefs that have none yet.
 *
 * Capped for the same reason briefing is: each draft is a model call against a
 * key the site owner pays for.
 */
async function runDrafting(websiteId, { limit = 5, format = 'news', authorSlug = null } = {}) {
    const ready = await CmsStoryBrief.findAll({
        where: { websiteId, status: 'ready' },
        order: [['createdAt', 'DESC']],
        limit: 100,
    });

    const results = [];
    let written = 0;
    for (const brief of ready) {
        if (written >= limit) break;
        const already = await CmsArticleDraft.count({ where: { briefId: brief.id, status: ['drafted', 'approved', 'published'] } });
        if (already) continue;
        try {
            const draft = await buildDraft(websiteId, brief.id, { format, authorSlug });
            results.push({ briefId: brief.id, draftId: draft.id, status: draft.status });
            if (draft.status === 'drafted') written += 1;
        } catch (err) {
            results.push({ briefId: brief.id, status: 'error', error: err.message });
        }
    }
    return { briefsReady: ready.length, drafted: written, results };
}

async function listDrafts(websiteId, { status = null, gateStatus = null, limit = 50 } = {}) {
    const where = { websiteId };
    if (status) where.status = status;
    if (gateStatus) where.gateStatus = gateStatus;
    return CmsArticleDraft.findAll({ where, order: [['createdAt', 'DESC']], limit: Math.min(Number(limit) || 50, 200) });
}

async function getDraft(websiteId, draftId) {
    const draft = await CmsArticleDraft.findOne({ where: { id: draftId, websiteId } });
    if (!draft) throw new AppError('NOT_FOUND', 'Draft not found', 404);
    return draft;
}

module.exports = {
    buildDraft, runDrafting, listDrafts, getDraft,
    sectionsToBlocks, buildSystemPrompt, buildUserPrompt, wordBudget, resolveCategory,
};
