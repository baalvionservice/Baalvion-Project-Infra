'use strict';
const db = require('../models');
const visibility = require('../domain/visibility');
const { VIEW_LEVEL, CASE_STATUS } = require('../domain/visibility');
const resourceService = require('./resourceService');
const communityService = require('./communityService');
const caseService = require('./caseService');
const { notFound } = require('../utils/errors');

/**
 * "You might also look at…" for a case.
 *
 * Two rules govern everything here.
 *
 * The first is that a related-items list is a DISCOVERY SURFACE. It is reached from a page
 * anyone might open, it returns rows the caller did not name, and it is therefore exactly the
 * shape of thing that leaks. So related cases are read through the same
 * `visibility.scopeWhere(ctx)` predicate the main listing uses — not a second query with its
 * own idea of who may see what. If the rule changes, it changes in one place and this follows.
 *
 * The second is that the CONNECTION can be as sensitive as the content. Knowing that two
 * cases were matched on the same rare combination of country and support type is a fact about
 * both of them. So the response never explains why anything was chosen, and the matching
 * signals are deliberately coarse — a country, a category of help — rather than anything that
 * narrows to a person.
 */

/**
 * Which resource categories answer a given kind of asked-for support.
 *
 * Coarse on purpose. "This person asked for legal help, here are the legal resources" is a
 * useful, unsurprising connection; anything finer starts to look like a profile.
 */
const NEED_TO_CATEGORY = Object.freeze({
    LEGAL: ['LEGAL', 'RIGHTS'],
    MEDIATION: ['MEDIATION'],
    COUNSELLING: ['COUNSELLING'],
    LISTENING: ['COUNSELLING'],
    PRACTICAL: ['FINANCIAL'],
    COMMUNITY: [],
    OTHER: [],
});

const RESOURCE_LIMIT = 4;
const COMMUNITY_LIMIT = 3;
const CASE_LIMIT = 4;

/** Categories worth offering for this case, always including the safety ones. */
function categoriesFor(supportNeeded) {
    const wanted = new Set();
    for (const need of supportNeeded || []) {
        for (const category of NEED_TO_CATEGORY[need] || []) wanted.add(category);
    }
    // Safety guidance is offered on every case, whatever was asked for. Somebody who did not
    // think to ask for it is precisely who most needs to see where it is.
    wanted.add('SAFETY');
    return [...wanted];
}

async function relatedResources(row) {
    const categories = categoriesFor(row.support_needed);
    const where = { is_published: true, category: { [db.Op.in]: categories } };

    // Same-country guidance first where it exists — legal and support information is mostly
    // useless from the wrong jurisdiction — then anything not tied to a country at all.
    const order = row.country_code
        ? [[db.sequelize.literal(`CASE WHEN country_code = ${db.sequelize.escape(row.country_code)} THEN 0 WHEN country_code IS NULL THEN 1 ELSE 2 END`)], ['title', 'ASC']]
        : [[db.sequelize.literal('CASE WHEN country_code IS NULL THEN 0 ELSE 1 END')], ['title', 'ASC']];

    const rows = await db.Resource.findAll({ where, order, limit: RESOURCE_LIMIT });
    return rows.map(resourceService.serializeCard);
}

async function relatedCommunities(ctx, row) {
    // The same rule the community listing applies: public communities, plus the private ones
    // this caller is already in. A private community must not become discoverable by being
    // adjacent to a case.
    const visible = [{ visibility: 'PUBLIC' }];
    if (ctx.communityIds.length) visible.push({ id: { [db.Op.in]: ctx.communityIds } });

    const filters = [{ is_active: true }, { [db.Op.or]: visible }];
    // The case's own community is shown on the page already; this is for the others.
    if (row.community_id) filters.push({ id: { [db.Op.ne]: row.community_id } });

    const order = row.country_code
        ? [[db.sequelize.literal(`CASE WHEN country_code = ${db.sequelize.escape(row.country_code)} THEN 0 WHEN country_code IS NULL THEN 1 ELSE 2 END`)], ['name', 'ASC']]
        : [['name', 'ASC']];

    const rows = await db.Community.findAll({ where: { [db.Op.and]: filters }, order, limit: COMMUNITY_LIMIT });
    const stats = await communityService.activityFor(rows.map((r) => r.id));
    return rows.map((r) => communityService.serialize(r, ctx, stats[r.id]));
}

async function relatedCases(ctx, row) {
    const filters = [
        // THE authorization predicate — the same one the case list uses. Everything else in
        // this function only narrows what it already permits.
        visibility.scopeWhere(ctx),
        { id: { [db.Op.ne]: row.id } },
        { status: { [db.Op.ne]: CASE_STATUS.DRAFT } },
    ];

    // A coarse connection: the same country, or an overlap in the kind of help asked for.
    const signals = [];
    if (row.country_code) signals.push({ country_code: row.country_code });
    if (Array.isArray(row.support_needed) && row.support_needed.length) {
        signals.push({ support_needed: { [db.Op.overlap]: row.support_needed } });
    }
    if (signals.length === 0) return [];
    filters.push({ [db.Op.or]: signals });

    const rows = await db.Case.findAll({
        where: { [db.Op.and]: filters },
        order: [['created_at', 'DESC']],
        limit: CASE_LIMIT,
    });

    // Serialised at the level each row's own rule allows, exactly as the listing does. A row
    // the caller may only see in summary comes back as a summary.
    return rows.map((r) => caseService.serialize(r, visibility.viewLevel(ctx, r), { participants: [] }));
}

/**
 * Related material for one case.
 *
 * The case itself is re-read under the caller's own visibility rule first, so this cannot be
 * used to confirm that a case exists: an id the caller may not see answers 404 here for the
 * same reason it does on the case itself.
 */
async function forCase(ctx, caseId) {
    const row = await db.Case.findByPk(caseId);
    if (!row || visibility.viewLevel(ctx, row) === VIEW_LEVEL.NONE) throw notFound('Case');

    const [resources, communities, cases] = await Promise.all([
        relatedResources(row),
        relatedCommunities(ctx, row),
        relatedCases(ctx, row),
    ]);

    // No `reason` field, by design. Why two cases sit next to each other is itself a fact
    // about both of them, and not one either owner agreed to publish.
    return { resources, communities, cases };
}

module.exports = { forCase, NEED_TO_CATEGORY, categoriesFor };
