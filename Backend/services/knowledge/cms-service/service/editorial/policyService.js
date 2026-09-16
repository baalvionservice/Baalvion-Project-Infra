'use strict';

/**
 * Enforces the publication policy at the moment of approval.
 *
 * Everything here answers one of two questions: "may this go out now?" and "what
 * does the desk still owe today?". The first is a hard gate -- a violation
 * refuses the approval. The second drives the planner, so the day's stories are
 * chosen to fill under-served beats rather than following whatever the wire was
 * loudest about.
 *
 * Days and publish windows are evaluated in UTC. That is a deliberate
 * simplification and it is the same clock the rest of the CMS stores timestamps
 * in; a per-site editorial timezone is the obvious next step if a desk ever
 * wants windows expressed in its own local hours.
 */

const { Op } = require('sequelize');
const { CmsPublicationPolicy, CmsContent, CmsCategory, CmsWebsite } = require('../../models');
const { AppError } = require('../../utils/errors');

const EDITABLE = [
    'dailyTarget', 'dailyMax', 'hourlyMax', 'minMinutesBetweenPosts', 'weekendTargetPct',
    'categoryMix', 'formatMix', 'publishWindows', 'wordCountRules',
    'requireOriginalArt', 'requireReviewerDistinctFromAuthor', 'maxArticlesPerAuthorPerDay',
    'correctionsPolicyUrl', 'correctionWindowHours', 'staleAfterDays', 'requireUpdateNote',
    'deadCategorySlugs',
    'autoPublishEnabled', 'autoPublishDelayMinutes', 'notifyEmails', 'onTimerConflict',
    'status',
];

const INT_LIMITS = {
    dailyTarget: { min: 0, max: 200 },
    dailyMax: { min: 1, max: 300 },
    hourlyMax: { min: 1, max: 60 },
    minMinutesBetweenPosts: { min: 0, max: 720 },
    weekendTargetPct: { min: 0, max: 200 },
    maxArticlesPerAuthorPerDay: { min: 1, max: 50 },
    correctionWindowHours: { min: 1, max: 720 },
    // A window under a minute is not a veto window; over a day it is a backlog.
    autoPublishDelayMinutes: { min: 1, max: 1440 },
    staleAfterDays: { min: 7, max: 3650 },
};

// Content types this policy governs. Static pages are not newsroom output and
// are deliberately not counted against a daily quota.
const GOVERNED_TYPES = ['news', 'article', 'post'];

const startOfUtcDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
// JS getUTCDay() is 0=Sunday; policy windows use ISO days where 1=Monday, 7=Sunday.
const isoDay = (d) => d.getUTCDay() === 0 ? 7 : d.getUTCDay();
const isWeekend = (d) => isoDay(d) >= 6;

async function getPolicy(websiteId) {
    return CmsPublicationPolicy.findOne({ where: { websiteId } });
}

async function requirePolicy(websiteId) {
    const policy = await getPolicy(websiteId);
    if (!policy) {
        throw new AppError(
            'POLICY_MISSING',
            'This website has no publication policy yet. Set daily volume, beat distribution and publishing windows before running the pipeline.',
            409
        );
    }
    return policy;
}

async function upsertPolicy(websiteId, patch = {}, userId = null) {
    const website = await CmsWebsite.findByPk(websiteId);
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const clean = {};
    for (const key of EDITABLE) {
        if (!(key in patch)) continue;
        if (key in INT_LIMITS) {
            const n = Number(patch[key]);
            if (!Number.isFinite(n)) continue;
            const { min, max } = INT_LIMITS[key];
            clean[key] = Math.min(max, Math.max(min, Math.round(n)));
        } else if (['categoryMix', 'formatMix', 'publishWindows', 'wordCountRules', 'deadCategorySlugs', 'notifyEmails'].includes(key)) {
            clean[key] = Array.isArray(patch[key]) ? patch[key] : [];
        } else if (typeof patch[key] === 'boolean') {
            clean[key] = patch[key];
        } else {
            clean[key] = patch[key] == null ? null : String(patch[key]).trim();
        }
    }

    // dailyMax below dailyTarget would make the target permanently unreachable;
    // treat the target as the binding number and lift the ceiling to meet it.
    const existing = await getPolicy(websiteId);
    const merged = { ...(existing ? existing.get() : {}), ...clean };
    if (Number(merged.dailyMax) < Number(merged.dailyTarget)) clean.dailyMax = Number(merged.dailyTarget);

    if (existing) {
        await existing.update({ ...clean, updatedBy: userId });
        return existing.reload();
    }
    return CmsPublicationPolicy.create({ websiteId, ...clean, createdBy: userId, updatedBy: userId });
}

/** The day's target, adjusted for weekends. */
function effectiveDailyTarget(policy, at = new Date()) {
    const base = Number(policy.dailyTarget) || 0;
    if (!isWeekend(at)) return base;
    return Math.round((base * (Number(policy.weekendTargetPct) || 0)) / 100);
}

/** True when `at` falls inside any configured window. No windows = always open. */
function insidePublishWindow(policy, at = new Date()) {
    const windows = Array.isArray(policy.publishWindows) ? policy.publishWindows : [];
    if (!windows.length) return { open: true, window: null };
    const day = isoDay(at);
    const hour = at.getUTCHours();
    for (const w of windows) {
        const days = Array.isArray(w.days) && w.days.length ? w.days.map(Number) : [1, 2, 3, 4, 5, 6, 7];
        if (!days.includes(day)) continue;
        const start = Number(w.startHourUtc);
        const end = Number(w.endHourUtc);
        if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
        // A window may wrap midnight (e.g. 22:00 -> 04:00).
        const open = start <= end ? hour >= start && hour < end : hour >= start || hour < end;
        if (open) return { open: true, window: w };
    }
    return { open: false, window: null };
}

/**
 * What has actually gone out today, from cms_contents -- the real published
 * record, not the pipeline's own bookkeeping. Counting the source of truth means
 * anything published by hand still consumes the day's quota.
 */
async function getDayState(websiteId, at = new Date()) {
    const dayStart = startOfUtcDay(at);
    const hourAgo = new Date(at.getTime() - 60 * 60 * 1000);

    const published = await CmsContent.findAll({
        where: {
            websiteId,
            status: 'published',
            contentType: { [Op.in]: GOVERNED_TYPES },
            publishedAt: { [Op.gte]: dayStart, [Op.lte]: at },
        },
        attributes: ['id', 'categoryId', 'publishedAt', 'customFields'],
        raw: true,
    });

    const categories = await CmsCategory.findAll({ where: { websiteId }, attributes: ['id', 'slug'], raw: true });
    const slugById = new Map(categories.map((c) => [c.id, c.slug]));

    const perCategory = {};
    const perAuthor = {};
    let lastPublishedAt = null;
    let publishedLastHour = 0;

    for (const row of published) {
        const slug = slugById.get(row.categoryId) || 'uncategorized';
        perCategory[slug] = (perCategory[slug] || 0) + 1;

        // Byline lives in customFields.authorSlug (see cms_authors' doc comment).
        const authorSlug = row.customFields && row.customFields.authorSlug;
        if (authorSlug) perAuthor[authorSlug] = (perAuthor[authorSlug] || 0) + 1;

        const ts = row.publishedAt ? new Date(row.publishedAt) : null;
        if (ts) {
            if (!lastPublishedAt || ts > lastPublishedAt) lastPublishedAt = ts;
            if (ts >= hourAgo) publishedLastHour += 1;
        }
    }

    return {
        dayStartUtc: dayStart.toISOString(),
        publishedToday: published.length,
        publishedLastHour,
        lastPublishedAt: lastPublishedAt ? lastPublishedAt.toISOString() : null,
        perCategory,
        perAuthor,
    };
}

/**
 * Per-beat deficit for the rest of the day. Positive `deficit` means the beat is
 * behind its share; the planner works down this list.
 */
async function planTargets(websiteId, at = new Date()) {
    const policy = await requirePolicy(websiteId);
    const state = await getDayState(websiteId, at);
    const target = effectiveDailyTarget(policy, at);
    const mix = Array.isArray(policy.categoryMix) ? policy.categoryMix : [];

    const beats = mix.map((m) => {
        const done = state.perCategory[m.categorySlug] || 0;
        const share = Math.round((target * (Number(m.targetPct) || 0)) / 100);
        const floor = Number(m.minPerDay) || 0;
        const want = Math.max(share, floor);
        const ceiling = Number.isFinite(Number(m.maxPerDay)) ? Number(m.maxPerDay) : Infinity;
        return {
            categorySlug: m.categorySlug,
            label: m.label || m.categorySlug,
            targetPct: Number(m.targetPct) || 0,
            want,
            done,
            deficit: Math.max(0, Math.min(want, ceiling) - done),
            atCeiling: done >= ceiling,
        };
    }).sort((a, b) => b.deficit - a.deficit);

    return {
        dailyTarget: target,
        publishedToday: state.publishedToday,
        remaining: Math.max(0, target - state.publishedToday),
        hardCeiling: Number(policy.dailyMax),
        beats,
        state,
    };
}

function countWords(contentBlocks = []) {
    const text = (Array.isArray(contentBlocks) ? contentBlocks : [])
        .map((b) => (b && b.content && (b.content.text || b.content.html || b.content.quote)) || '')
        .join(' ');
    return (String(text).replace(/<[^>]+>/g, ' ').match(/\S+/g) || []).length;
}

/**
 * The approval gate. Returns { allowed, violations, warnings } -- violations are
 * refusals, warnings are shown to the editor and do not block.
 */
async function evaluatePublish(websiteId, {
    categorySlug = null, authorSlug = null, reviewerSlug = null,
    contentBlocks = [], format = 'news', hasOriginalArt = false,
    outputContentType = 'news', at = new Date(),
} = {}) {
    const policy = await requirePolicy(websiteId);
    const state = await getDayState(websiteId, at);
    const violations = [];
    const warnings = [];

    if (state.publishedToday >= Number(policy.dailyMax)) {
        violations.push({ rule: 'dailyMax', message: `Daily ceiling reached: ${state.publishedToday}/${policy.dailyMax} published today.` });
    }
    if (state.publishedLastHour >= Number(policy.hourlyMax)) {
        violations.push({ rule: 'hourlyMax', message: `Hourly ceiling reached: ${state.publishedLastHour}/${policy.hourlyMax} in the last hour.` });
    }
    if (state.lastPublishedAt && Number(policy.minMinutesBetweenPosts) > 0) {
        const gapMin = (at.getTime() - new Date(state.lastPublishedAt).getTime()) / 60000;
        if (gapMin < Number(policy.minMinutesBetweenPosts)) {
            violations.push({
                rule: 'minMinutesBetweenPosts',
                message: `Only ${Math.floor(gapMin)} min since the last post; policy requires ${policy.minMinutesBetweenPosts} min.`,
            });
        }
    }

    const windowState = insidePublishWindow(policy, at);
    if (!windowState.open) {
        violations.push({ rule: 'publishWindow', message: 'Outside every configured publishing window. Schedule it for the next window instead.' });
    }

    // A category can exist in the CMS and still have no working public route --
    // Imperialpedia's retired guide tree is 66 such categories, every one of them
    // still selectable in the admin panel. Publishing into one produces a page
    // that redirects to the homepage, which is worse than not publishing at all.
    //
    // This only applies to output whose URL is built from its category. A news
    // item routes to /world/<region>/... regardless of which topic it carries, so
    // a retired *guide* route says nothing about whether that news story is
    // reachable -- blocking on it there would reject perfectly good stories.
    const dead = Array.isArray(policy.deadCategorySlugs) ? policy.deadCategorySlugs : [];
    const categoryDrivesUrl = outputContentType === 'article';
    if (categoryDrivesUrl && categorySlug && dead.includes(categorySlug)) {
        violations.push({
            rule: 'deadCategoryRoute',
            message: `"${categorySlug}" has no working public route on this site (last verified ${policy.routesVerifiedAt ? new Date(policy.routesVerifiedAt).toISOString().slice(0, 10) : 'never'}). Pick a live category, or restore the route first.`,
        });
    }

    const mix = (Array.isArray(policy.categoryMix) ? policy.categoryMix : []).find((m) => m.categorySlug === categorySlug);
    if (mix && Number.isFinite(Number(mix.maxPerDay))) {
        const done = state.perCategory[categorySlug] || 0;
        if (done >= Number(mix.maxPerDay)) {
            violations.push({ rule: 'categoryMaxPerDay', message: `${mix.label || categorySlug} is at its daily ceiling (${done}/${mix.maxPerDay}).` });
        }
    }

    if (authorSlug && Number(policy.maxArticlesPerAuthorPerDay) > 0) {
        const byAuthor = state.perAuthor[authorSlug] || 0;
        if (byAuthor >= Number(policy.maxArticlesPerAuthorPerDay)) {
            violations.push({
                rule: 'maxArticlesPerAuthorPerDay',
                message: `${authorSlug} already carries ${byAuthor} bylines today (limit ${policy.maxArticlesPerAuthorPerDay}). Assign another contributor.`,
            });
        }
    }

    if (policy.requireReviewerDistinctFromAuthor && reviewerSlug && authorSlug && reviewerSlug === authorSlug) {
        violations.push({ rule: 'reviewerDistinct', message: 'The reviewer cannot be the author. Assign a second person.' });
    }

    if (policy.requireOriginalArt && !hasOriginalArt) {
        violations.push({ rule: 'requireOriginalArt', message: 'No owned or licensed art attached; policy requires original art on every published piece.' });
    }

    const words = countWords(contentBlocks);
    const rule = (Array.isArray(policy.wordCountRules) ? policy.wordCountRules : []).find((r) => r.format === format);
    if (rule) {
        if (Number.isFinite(Number(rule.min)) && words < Number(rule.min)) {
            violations.push({ rule: 'wordCountMin', message: `${words} words; ${format} needs at least ${rule.min}.` });
        }
        if (Number.isFinite(Number(rule.max)) && words > Number(rule.max)) {
            violations.push({ rule: 'wordCountMax', message: `${words} words; ${format} is capped at ${rule.max}. Cut rather than pad.` });
        }
    }

    const target = effectiveDailyTarget(policy, at);
    if (state.publishedToday < target) {
        warnings.push({ rule: 'dailyTarget', message: `${state.publishedToday}/${target} published today.` });
    }

    return { allowed: violations.length === 0, violations, warnings, words, dayState: state };
}

module.exports = {
    getPolicy, requirePolicy, upsertPolicy,
    effectiveDailyTarget, insidePublishWindow, getDayState, planTargets,
    evaluatePublish, countWords,
    EDITABLE, INT_LIMITS, GOVERNED_TYPES,
};
