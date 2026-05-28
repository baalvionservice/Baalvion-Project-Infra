'use strict';
/**
 * Generic PostgREST-compatible query engine.
 *
 * The frontend adapter (src/integrations/supabase/client.ts) reproduces the
 * supabase-js query-builder interface and POSTs a query spec here. This engine
 * executes it via Sequelize while enforcing per-table authorization that
 * replaces the Row-Level-Security policies the Supabase schema used.
 *
 * Spec body:
 *   { table, action, columns, filters[], order[], limit, offset, count, head,
 *     single, maybeSingle, values, onConflict, returning }
 */
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

// ── Authorization policies (one per exposed table) ────────────────────────────
// read:  public | auth | owner | admin            (owner ⇒ scoped to owner col; admins see all)
// write: none | auth | owner | admin              (applies to insert/update/delete)
// owner: column compared against the caller's user id
// mod:   moderators (+admins) bypass owner scoping on writes
// adminWrite: admins may write any row (owner still writes own)
// noInsert: inserts require admin (rows are created server-side)
// custom: special-cased table name (see customScope)
const POLICIES = {
    profiles:             { read: 'public', write: 'owner', owner: 'id' },
    user_roles:           { read: 'owner',  write: 'admin', owner: 'user_id' },
    badges:               { read: 'public', write: 'admin' },
    user_badges:          { read: 'public', write: 'admin' },
    forum_categories:     { read: 'public', write: 'admin' },
    forum_threads:        { read: 'auth',   write: 'owner', owner: 'author_id', mod: true },
    forum_posts:          { read: 'auth',   write: 'owner', owner: 'author_id', mod: true },
    post_likes:           { read: 'auth',   write: 'owner', owner: 'user_id' },
    thread_bookmarks:     { read: 'owner',  write: 'owner', owner: 'user_id' },
    tags:                 { read: 'public', write: 'admin' },
    thread_tags:          { read: 'auth',   write: 'auth' },
    products:             { read: 'public', write: 'admin' },
    orders:               { read: 'owner',  write: 'owner', owner: 'user_id' },
    deals:                { read: 'auth',   write: 'owner', owner: 'founder_id' },
    deal_interests:       { read: 'custom', write: 'custom', custom: 'deal_interests' },
    member_applications:  { read: 'owner',  write: 'owner', owner: 'user_id', adminWrite: true },
    elite_applications:   { read: 'owner',  write: 'owner', owner: 'user_id', adminWrite: true },
    elite_badges:         { read: 'public', write: 'admin' },
    elite_leaderboard:    { read: 'public', write: 'admin' },
    elite_subscriptions:  { read: 'owner',  write: 'owner', owner: 'user_id', adminWrite: true },
    notifications:        { read: 'owner',  write: 'owner', owner: 'user_id', noInsert: true },
    user_activities:      { read: 'owner',  write: 'owner', owner: 'user_id' },
    app_settings:         { read: 'admin',  write: 'admin' },
    tag_analytics_reports:{ read: 'admin',  write: 'admin' },
    investors:            { read: 'auth',   write: 'admin' },
    investor_socials:     { read: 'auth',   write: 'admin' },
    investments:          { read: 'auth',   write: 'admin' },
    investor_news:        { read: 'auth',   write: 'admin' },
    connection_requests:  { read: 'owner',  write: 'owner', owner: 'from_user_id', adminWrite: true },
    memberships:          { read: 'owner',  write: 'admin', owner: 'user_id' },
    member_connections:   { read: 'custom', write: 'custom', custom: 'member_connections' },
    company_members:      { read: 'auth',   write: 'owner', owner: 'founder_id' },
    traction_metrics:     { read: 'auth',   write: 'owner', owner: 'founder_id' },
    verifications:        { read: 'owner',  write: 'owner', owner: 'user_id', adminWrite: true },
    data_room_access:     { read: 'custom', write: 'owner', owner: 'founder_id', custom: 'data_room' },
    saved_startups:       { read: 'owner',  write: 'owner', owner: 'investor_user_id' },
    investor_pipeline:    { read: 'owner',  write: 'owner', owner: 'investor_user_id' },
    payments:             { read: 'owner',  write: 'admin', owner: 'user_id' },
};

// Belongs-to foreign keys for embedded selects: localTable -> { targetTable: localFkColumn }
const EMBED_FK = {
    forum_threads:    { profiles: 'author_id', forum_categories: 'category_id' },
    forum_posts:      { profiles: 'author_id' },
    thread_tags:      { tags: 'tag_id', forum_threads: 'thread_id' },
    thread_bookmarks: { forum_threads: 'thread_id' },
    orders:           { products: 'product_id' },
    connection_requests: { investors: 'investor_id', profiles: 'from_user_id', deals: 'deal_id' },
    saved_startups:      { profiles: 'founder_id' },
    investor_pipeline:   { profiles: 'founder_id' },
    data_room_access:    { profiles: 'founder_id' },
};

const OPS = {
    eq: Op.eq, neq: Op.ne, gt: Op.gt, gte: Op.gte, lt: Op.lt, lte: Op.lte,
    like: Op.like, ilike: Op.iLike, in: Op.in, is: Op.is,
};

const ctxFrom = (req) => {
    const roles = req.auth?.roles || [];
    return { userId: req.auth?.userId || null, roles, isAdmin: roles.includes('admin'), isMod: roles.includes('moderator') || roles.includes('admin') };
};

// Split a select list on top-level commas (ignoring commas inside parentheses).
const splitTop = (s) => {
    const out = [];
    let depth = 0, cur = '';
    for (const ch of s) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur);
    return out.map((x) => x.trim()).filter(Boolean);
};

// Parse a (possibly nested) PostgREST select string.
const parseSelect = (str) => {
    const scalars = [];
    const embeds = [];
    for (const item of splitTop((str || '*').replace(/\s+/g, ' '))) {
        const open = item.indexOf('(');
        if (open === -1) { scalars.push(item.trim()); continue; }
        const head = item.slice(0, open).trim();
        const body = item.slice(open + 1, item.lastIndexOf(')'));
        const m = head.match(/^(?:([\w]+):)?([\w]+)(?:!([\w]+))?$/);
        if (!m) continue;
        const [, alias, table, fkHint] = m;
        embeds.push({ alias: alias || table, table, fkHint, sub: parseSelect(body) });
    }
    return { scalars, embeds };
};

const localKeyFor = (localTable, embed) => {
    const mapped = EMBED_FK[localTable] && EMBED_FK[localTable][embed.table];
    if (mapped) return mapped;
    if (embed.fkHint && embed.fkHint.endsWith('_fkey') && embed.fkHint.startsWith(`${localTable}_`)) {
        return embed.fkHint.slice(localTable.length + 1, -'_fkey'.length);
    }
    return `${embed.alias}_id`;
};

const attrsFor = (model, parsed, extraKeys = []) => {
    if (!parsed || parsed.scalars.includes('*') || parsed.scalars.length === 0) {
        if (extraKeys.length === 0) return undefined; // all columns
    }
    const cols = new Set([...(parsed.scalars.filter((c) => c !== '*')), ...extraKeys]);
    // Keep only real columns of the model.
    const valid = [...cols].filter((c) => model.rawAttributes[c]);
    return valid.length ? valid : undefined;
};

// Recursively attach belongs-to embeds onto a set of parent plain rows.
async function stitch(rows, localTable, embeds) {
    if (!rows.length || !embeds.length) return;
    for (const embed of embeds) {
        const targetModel = db.byTable[embed.table];
        if (!targetModel) continue;
        const lk = localKeyFor(localTable, embed);
        const ids = [...new Set(rows.map((r) => r[lk]).filter((v) => v != null))];
        const resultKey = embed.alias;
        if (!ids.length) { rows.forEach((r) => { r[resultKey] = null; }); continue; }
        const childExtra = embed.sub.embeds.map((e) => localKeyFor(embed.table, e));
        const attrs = attrsFor(targetModel, embed.sub, ['id', ...childExtra]);
        const targets = (await targetModel.findAll({ where: { id: { [Op.in]: ids } }, attributes: attrs }))
            .map((t) => t.get({ plain: true }));
        await stitch(targets, embed.table, embed.sub.embeds);
        // Drop helper keys the caller did not explicitly request.
        const requested = new Set(embed.sub.scalars);
        if (!embed.sub.scalars.includes('*')) {
            targets.forEach((t) => childExtra.forEach((k) => { if (!requested.has(k)) delete t[k]; }));
        }
        const map = new Map(targets.map((t) => [t.id, t]));
        rows.forEach((r) => { r[resultKey] = map.get(r[lk]) || null; });
    }
}

const buildWhere = (filters = []) => {
    const where = {};
    for (const f of filters) {
        const op = OPS[f.op];
        if (!op) continue;
        const cond = { [op]: f.val };
        where[f.col] = where[f.col] ? Object.assign({}, where[f.col], cond) : cond;
    }
    return where;
};

const mergeWhere = (a, b) => {
    if (!b) return a;
    if (!a || Object.keys(a).length === 0) return b;
    return { [Op.and]: [a, b] };
};

// Build the OR-scope for deal_interests (own interest OR interest on own deal).
async function dealInterestScope(ctx) {
    const myDeals = await db.Deal.findAll({ where: { founder_id: ctx.userId }, attributes: ['id'] });
    const ids = myDeals.map((d) => d.id);
    const or = [{ investor_id: ctx.userId }];
    if (ids.length) or.push({ deal_id: { [Op.in]: ids } });
    return { [Op.or]: or };
}

// member_connections: a row is visible/editable by either party (sender or recipient).
const memberConnScope = (ctx) => ({ [Op.or]: [{ from_user_id: ctx.userId }, { to_user_id: ctx.userId }] });
// data_room_access: visible to the founder who owns it and the granted investor.
const dataRoomScope = (ctx) => ({ [Op.or]: [{ founder_id: ctx.userId }, { investor_user_id: ctx.userId }] });

// Returns a scope-where to AND with user filters for a READ, or throws 401/403.
async function scopeRead(table, policy, ctx) {
    switch (policy.read) {
        case 'public': return null;
        case 'auth':
            if (!ctx.userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
            return null;
        case 'owner':
            if (!ctx.userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
            return ctx.isAdmin ? null : { [policy.owner]: ctx.userId };
        case 'admin':
            if (!ctx.isAdmin) throw new AppError('FORBIDDEN', 'Admin access required', 403);
            return null;
        case 'custom':
            if (!ctx.userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
            if (ctx.isAdmin) return null;
            if (policy.custom === 'deal_interests') return dealInterestScope(ctx);
            if (policy.custom === 'member_connections') return memberConnScope(ctx);
            if (policy.custom === 'data_room') return dataRoomScope(ctx);
            throw new AppError('FORBIDDEN', 'Not permitted', 403);
        default:
            throw new AppError('FORBIDDEN', 'Not permitted', 403);
    }
}

// For writes: validates permission, returns a scope-where for update/delete, and
// (for inserts) stamps/validates the owner column on each row.
async function authorizeWrite(table, policy, ctx, action, values) {
    if (!ctx.userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    const mode = policy.write;

    if (mode === 'admin') {
        if (!ctx.isAdmin) throw new AppError('FORBIDDEN', 'Admin access required', 403);
        return null;
    }
    if (mode === 'auth') return null;

    if (mode === 'custom' && policy.custom === 'deal_interests') {
        if (action === 'insert') {
            const rows = Array.isArray(values) ? values : [values];
            rows.forEach((r) => { r.investor_id = ctx.userId; });
            return null;
        }
        return ctx.isAdmin ? null : dealInterestScope(ctx);
    }

    if (mode === 'custom' && policy.custom === 'member_connections') {
        if (action === 'insert') {
            const rows = Array.isArray(values) ? values : [values];
            rows.forEach((r) => { r.from_user_id = ctx.userId; }); // sender is always the caller
            return null;
        }
        return ctx.isAdmin ? null : memberConnScope(ctx); // either party can accept/decline/cancel
    }

    if (mode === 'owner') {
        if (action === 'insert') {
            if (policy.noInsert && !ctx.isAdmin) throw new AppError('FORBIDDEN', 'Not permitted', 403);
            const rows = Array.isArray(values) ? values : [values];
            if (!ctx.isAdmin) rows.forEach((r) => { r[policy.owner] = ctx.userId; });
            return null;
        }
        // update / delete
        if (ctx.isAdmin && (policy.adminWrite || policy.mod || policy.owner === 'id' || true)) {
            // Admins manage any row for owner-scoped tables (mirrors the admin RLS policies).
            return null;
        }
        if (policy.mod && ctx.isMod) return null;
        return { [policy.owner]: ctx.userId };
    }
    throw new AppError('FORBIDDEN', 'Not permitted', 403);
}

async function handleQuery(req, res, next) {
    try {
        const spec = req.body || {};
        const table = spec.table;
        const policy = POLICIES[table];
        const model = db.byTable[table];
        if (!policy || !model) throw new AppError('NOT_FOUND', `Unknown table '${table}'`, 404);
        const ctx = ctxFrom(req);
        const action = spec.action || 'select';
        const parsed = parseSelect(spec.columns || '*');

        if (action === 'select') {
            const scope = await scopeRead(table, policy, ctx);
            const where = mergeWhere(buildWhere(spec.filters), scope);

            if (spec.head) {
                const count = await model.count({ where });
                return sendSuccess(req, res, { data: null, count });
            }

            const childExtra = parsed.embeds.map((e) => localKeyFor(table, e));
            const findOpts = { where, attributes: attrsFor(model, parsed, childExtra) };
            if (Array.isArray(spec.order) && spec.order.length) {
                findOpts.order = spec.order.map((o) => [o.col, o.ascending ? 'ASC' : 'DESC']);
            }
            if (spec.limit != null) findOpts.limit = spec.limit;
            if (spec.offset != null) findOpts.offset = spec.offset;

            const found = await model.findAll(findOpts);
            const rows = found.map((r) => r.get({ plain: true }));
            await stitch(rows, table, parsed.embeds);
            // Strip helper FK keys not explicitly requested.
            if (!parsed.scalars.includes('*') && parsed.scalars.length) {
                const requested = new Set(parsed.scalars);
                rows.forEach((r) => childExtra.forEach((k) => { if (!requested.has(k)) delete r[k]; }));
            }

            let count = null;
            if (spec.count === 'exact') count = await model.count({ where });

            if (spec.single || spec.maybeSingle) {
                if (rows.length > 1) throw new AppError('PGRST116', 'Results contain multiple rows', 406);
                if (rows.length === 0) {
                    if (spec.single) throw new AppError('PGRST116', 'No rows found', 406);
                    return sendSuccess(req, res, { data: null, count });
                }
                return sendSuccess(req, res, { data: rows[0], count });
            }
            return sendSuccess(req, res, { data: rows, count });
        }

        if (action === 'insert' || action === 'upsert') {
            const values = spec.values;
            await authorizeWrite(table, policy, ctx, 'insert', values);
            const arr = Array.isArray(values) ? values : [values];
            let created;
            if (action === 'upsert') {
                created = await model.bulkCreate(arr, { ignoreDuplicates: true, returning: true });
            } else {
                created = await model.bulkCreate(arr, { returning: true, individualHooks: true });
            }
            if (!spec.returning) return sendSuccess(req, res, { data: null, count: null }, 201);
            const rows = created.map((r) => r.get({ plain: true }));
            const data = (!Array.isArray(values) || spec.single || spec.maybeSingle) ? (rows[0] || null) : rows;
            return sendSuccess(req, res, { data, count: null }, 201);
        }

        if (action === 'update') {
            const scope = await authorizeWrite(table, policy, ctx, 'update', spec.values);
            const where = mergeWhere(buildWhere(spec.filters), scope);
            const [, rows] = await model.update(spec.values, { where, returning: true });
            const plain = (rows || []).map((r) => r.get({ plain: true }));
            if (!spec.returning) return sendSuccess(req, res, { data: null, count: null });
            const data = (spec.single || spec.maybeSingle) ? (plain[0] || null) : plain;
            return sendSuccess(req, res, { data, count: null });
        }

        if (action === 'delete') {
            const scope = await authorizeWrite(table, policy, ctx, 'delete', spec.values);
            const where = mergeWhere(buildWhere(spec.filters), scope);
            if (!Object.keys(where).length && !scope) throw new AppError('BAD_REQUEST', 'Refusing unfiltered delete', 400);
            const count = await model.destroy({ where });
            return sendSuccess(req, res, { data: null, count });
        }

        throw new AppError('BAD_REQUEST', `Unsupported action '${action}'`, 400);
    } catch (err) { return next(err); }
}

module.exports = { handleQuery, POLICIES };
