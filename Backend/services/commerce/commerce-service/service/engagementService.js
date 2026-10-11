'use strict';
// Club engagement paid from the member's points wallet: draws and DJ demands.
// Every movement of points is one row in commerce_points_ledger, written in the same transaction as the
// thing it pays for, under the same per-user advisory lock the checkout uses, so a balance can never go negative.
const crypto = require('crypto');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const { AppError } = require('../utils/errors');

const L = 'commerce.commerce_points_ledger';
const DRAWS = 'commerce.commerce_lottery_draws';
const ENTRIES = 'commerce.commerce_lottery_entries';
const DEMANDS = 'commerce.commerce_dj_demands';
const PLEDGES = 'commerce.commerce_dj_pledges';
const PROFILES = 'commerce.commerce_member_profiles';

const MIN_PLEDGE_POINTS = 100;
const PENDING_PROPOSALS_PER_USER = 3;

const fail = (code, msg, status = 400) => new AppError(code, msg, status);
const sel = (sql, replacements, transaction) => sequelize.query(sql, { type: QueryTypes.SELECT, replacements, transaction });
const run = (sql, replacements, transaction) => sequelize.query(sql, { replacements, transaction });

async function lockUser(userId, t) {
    await run('SELECT pg_advisory_xact_lock(:k)', { k: Number(userId) }, t);
}
async function balance(userId, t) {
    const [r] = await sel(`SELECT COALESCE(SUM(delta), 0)::bigint AS p FROM ${L} WHERE user_id = :u`, { u: userId }, t);
    return Number(r.p);
}
async function memberNo(userId, t) {
    const [r] = await sel(`SELECT member_number AS n FROM ${PROFILES} WHERE user_id = :u`, { u: userId }, t);
    return r ? r.n : null;
}
async function ledger(userId, delta, reason, refId, note, t) {
    await run(`INSERT INTO ${L} (user_id, delta, reason, ref_id, member_number, note) VALUES (:u, :d, :r, :ref, :m, :n)`,
        { u: userId, d: delta, r: reason, ref: refId, m: await memberNo(userId, t), n: note }, t);
}

// ── Draws ────────────────────────────────────────────────────────────────────────────────────────

// Winners are the first distinct members when every entry is ranked by HMAC-SHA256(seed, entryId). The seed is stored with the
// draw, so anyone holding the entry list can recompute the same order.
function pickWinners(seed, entries, count) {
    const ranked = entries
        .map((e) => ({ ...e, rank: crypto.createHmac('sha256', seed).update(String(e.id)).digest('hex') }))
        .sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0));
    const seen = new Set();
    const winners = [];
    for (const e of ranked) {
        if (seen.has(String(e.user_id))) continue;
        seen.add(String(e.user_id));
        winners.push({ id: e.id, userId: e.user_id, position: winners.length + 1 });
        if (winners.length >= count) break;
    }
    return winners;
}

const presentDraw = (d, extra = {}) => ({
    id: d.id, title: d.title, prize: d.prize, entryPoints: d.entry_points, maxEntriesPerUser: d.max_entries_per_user,
    winnersCount: d.winners_count, closesAt: d.closes_at, status: d.status, drawnAt: d.drawn_at,
    ...(d.status === 'drawn' ? { drawSeed: d.draw_seed } : {}), ...extra,
});

async function drawStats(id, t) {
    const [r] = await sel(`SELECT COUNT(*) FILTER (WHERE status = 'active')::int AS entries, COUNT(DISTINCT user_id) FILTER (WHERE status = 'active')::int AS members FROM ${ENTRIES} WHERE draw_id = :id`, { id }, t);
    return r;
}
async function winnersOf(drawId, withIds, t) {
    const rows = await sel(
        `SELECT e.id AS "entryId", e.user_id AS "userId", e.ticket_no AS "ticketNo", e.win_position AS position, e.claimed_at AS "claimedAt", mp.member_number AS "memberNumber"
           FROM ${ENTRIES} e LEFT JOIN ${PROFILES} mp ON mp.user_id = e.user_id WHERE e.draw_id = :id AND e.won ORDER BY e.win_position`, { id: drawId }, t);
    return rows.map((r) => (withIds ? { entryId: r.entryId, ticketNo: r.ticketNo, position: r.position, memberNumber: r.memberNumber, claimed: !!r.claimedAt } : { ticketNo: r.ticketNo, position: r.position, memberNumber: r.memberNumber, claimed: !!r.claimedAt }));
}

async function createDraw(adminId, b) {
    const [[row]] = await run(
        `INSERT INTO ${DRAWS} (title, prize, entry_points, max_entries_per_user, winners_count, closes_at, created_by)
         VALUES (:title, :prize, :entry, :max, :winners, :closes, :by) RETURNING id`,
        { title: b.title, prize: b.prize, entry: b.entryPoints, max: b.maxEntriesPerUser, winners: b.winnersCount, closes: b.closesAt, by: adminId });
    return adminGetDraw(row.id);
}

async function setDrawStatus(id, from, to) {
    const [d] = await sel(`SELECT status FROM ${DRAWS} WHERE id = :id`, { id });
    if (!d) throw fail('NOT_FOUND', 'Draw not found', 404);
    if (!from.includes(d.status)) throw fail('CONFLICT', `This draw is ${d.status}`, 409);
    await run(`UPDATE ${DRAWS} SET status = :to, updated_at = NOW() WHERE id = :id`, { id, to });
    return adminGetDraw(id);
}
const openDraw = (id) => setDrawStatus(id, ['draft'], 'open');
const closeDraw = (id) => setDrawStatus(id, ['open'], 'closed');

async function updateDraw(id, b) {
    const [d] = await sel(`SELECT status FROM ${DRAWS} WHERE id = :id`, { id });
    if (!d) throw fail('NOT_FOUND', 'Draw not found', 404);
    if (d.status !== 'draft') throw fail('CONFLICT', 'Only a draft draw can be edited', 409);
    await run(
        `UPDATE ${DRAWS} SET title = :title, prize = :prize, entry_points = :entry, max_entries_per_user = :max, winners_count = :winners, closes_at = :closes, updated_at = NOW() WHERE id = :id`,
        { id, title: b.title, prize: b.prize, entry: b.entryPoints, max: b.maxEntriesPerUser, winners: b.winnersCount, closes: b.closesAt });
    return adminGetDraw(id);
}

async function enter(userId, drawId, count) {
    return sequelize.transaction(async (t) => {
        await lockUser(userId, t);
        const [d] = await sel(`SELECT * FROM ${DRAWS} WHERE id = :id FOR UPDATE`, { id: drawId }, t);
        if (!d || !['open'].includes(d.status)) throw fail('NOT_FOUND', 'This draw is not open', 404);
        if (new Date(d.closes_at).getTime() <= Date.now()) throw fail('CLOSED', 'Entries for this draw have closed', 409);
        const [mine] = await sel(`SELECT COUNT(*)::int AS n FROM ${ENTRIES} WHERE draw_id = :id AND user_id = :u AND status = 'active'`, { id: drawId, u: userId }, t);
        if (mine.n + count > d.max_entries_per_user) {
            throw fail('LIMIT', `You can hold at most ${d.max_entries_per_user} entries in this draw (you have ${mine.n})`, 409);
        }
        const cost = d.entry_points * count;
        if (cost > 0) {
            const have = await balance(userId, t);
            if (have < cost) throw fail('INSUFFICIENT_POINTS', `You need ${cost} points and have ${have}. Load your wallet first.`, 402, { need: cost, have });
        }
        const [{ max }] = await sel(`SELECT COALESCE(MAX(ticket_no), 0)::int AS max FROM ${ENTRIES} WHERE draw_id = :id`, { id: drawId }, t);
        const tickets = [];
        for (let i = 1; i <= count; i += 1) {
            const [[e]] = await run(
                `INSERT INTO ${ENTRIES} (draw_id, user_id, ticket_no, points_paid) VALUES (:d, :u, :n, :p) RETURNING id, ticket_no`,
                { d: drawId, u: userId, n: max + i, p: d.entry_points }, t);
            if (d.entry_points > 0) await ledger(userId, -d.entry_points, 'lottery_entry', e.id, `Entry #${e.ticket_no} in "${d.title}"`, t);
            tickets.push(e.ticket_no);
        }
        return { drawId, tickets, pointsSpent: cost, balance: await balance(userId, t) };
    });
}

async function refundDrawEntries(drawId, userIdFilter, t) {
    const rows = await sel(`SELECT id, user_id, points_paid FROM ${ENTRIES} WHERE draw_id = :id AND status = 'active'`, { id: drawId }, t);
    for (const e of rows) {
        await lockUser(e.user_id, t);
        await run(`UPDATE ${ENTRIES} SET status = 'refunded' WHERE id = :id`, { id: e.id }, t);
        if (e.points_paid > 0) await ledger(e.user_id, e.points_paid, 'lottery_refund', e.id, 'Draw cancelled: entry refunded', t);
    }
    return rows.length;
}

async function cancelDraw(id) {
    return sequelize.transaction(async (t) => {
        const [d] = await sel(`SELECT status FROM ${DRAWS} WHERE id = :id FOR UPDATE`, { id }, t);
        if (!d) throw fail('NOT_FOUND', 'Draw not found', 404);
        if (!['draft', 'open', 'closed'].includes(d.status)) throw fail('CONFLICT', `This draw is ${d.status}`, 409);
        await refundDrawEntries(id, null, t);
        await run(`UPDATE ${DRAWS} SET status = 'cancelled', updated_at = NOW() WHERE id = :id`, { id }, t);
        return adminGetDraw(id, t);
    });
}

// One shot: a draw can be run exactly once, and the seed cannot be chosen by the admin.
async function runDraw(id) {
    return sequelize.transaction(async (t) => {
        const [d] = await sel(`SELECT * FROM ${DRAWS} WHERE id = :id FOR UPDATE`, { id }, t);
        if (!d) throw fail('NOT_FOUND', 'Draw not found', 404);
        if (!['open', 'closed'].includes(d.status)) throw fail('CONFLICT', `This draw is ${d.status}`, 409);
        if (d.status === 'open' && new Date(d.closes_at).getTime() > Date.now()) throw fail('NOT_YET', 'Close the draw first, or wait until its closing time', 409);
        const entries = await sel(`SELECT id, user_id FROM ${ENTRIES} WHERE draw_id = :id AND status = 'active'`, { id }, t);
        if (entries.length === 0) throw fail('NO_ENTRIES', 'There are no entries to draw from', 409);
        const seed = crypto.randomBytes(32).toString('hex');
        const winners = pickWinners(seed, entries, d.winners_count);
        for (const w of winners) await run(`UPDATE ${ENTRIES} SET won = TRUE, win_position = :p WHERE id = :id`, { id: w.id, p: w.position }, t);
        await run(`UPDATE ${DRAWS} SET status = 'drawn', drawn_at = NOW(), draw_seed = :seed, updated_at = NOW() WHERE id = :id`, { id, seed }, t);
        return adminGetDraw(id, t);
    });
}

async function markClaimed(entryId) {
    const [r] = await run(`UPDATE ${ENTRIES} SET claimed_at = NOW() WHERE id = :id AND won AND claimed_at IS NULL RETURNING id`, { id: entryId });
    if (!r || r.length === 0) throw fail('CONFLICT', 'Nothing to mark: not a winning entry, or already claimed', 409);
    return { ok: true };
}

async function listDrawsPublic() {
    const draws = await sel(`SELECT * FROM ${DRAWS} WHERE status IN ('open','closed','drawn') ORDER BY (status = 'open') DESC, closes_at DESC LIMIT 8`, {});
    const out = [];
    for (const d of draws) {
        out.push(presentDraw(d, { ...(await drawStats(d.id)), winners: d.status === 'drawn' ? await winnersOf(d.id, false) : [] }));
    }
    return { items: out, total: out.length };
}

async function myEntries(userId) {
    const rows = await sel(
        `SELECT e.draw_id AS "drawId", e.ticket_no AS "ticketNo", e.status, e.won, e.win_position AS position, e.claimed_at AS "claimedAt", d.title
           FROM ${ENTRIES} e JOIN ${DRAWS} d ON d.id = e.draw_id WHERE e.user_id = :u ORDER BY e.created_at DESC LIMIT 100`, { u: userId });
    return { items: rows, balance: await balance(userId) };
}

async function adminListDraws() {
    const draws = await sel(`SELECT * FROM ${DRAWS} ORDER BY created_at DESC LIMIT 50`, {});
    const out = [];
    for (const d of draws) out.push(presentDraw(d, { ...(await drawStats(d.id)), winners: d.status === 'drawn' ? await winnersOf(d.id, true) : [] }));
    return { items: out, total: out.length };
}
async function adminGetDraw(id, t) {
    const [d] = await sel(`SELECT * FROM ${DRAWS} WHERE id = :id`, { id }, t);
    if (!d) throw fail('NOT_FOUND', 'Draw not found', 404);
    return presentDraw(d, { ...(await drawStats(id, t)), winners: d.status === 'drawn' ? await winnersOf(id, true, t) : [] });
}

// ── DJ demands ───────────────────────────────────────────────────────────────────────────────────

const presentDemand = (d, s) => ({
    id: d.id, djName: d.dj_name, genre: d.genre, clubName: d.club_name, city: d.city, state: d.state, note: d.note,
    targetPoints: Number(d.target_points), status: d.status, closesAt: d.closes_at, decisionNote: d.decision_note,
    createdAt: d.created_at, pledgedPoints: Number(s.held) + Number(s.applied), pledgers: s.pledgers,
});
async function demandStats(id, t) {
    const [r] = await sel(
        `SELECT COALESCE(SUM(points) FILTER (WHERE status = 'held'), 0)::bigint AS held, COALESCE(SUM(points) FILTER (WHERE status = 'applied'), 0)::bigint AS applied,
                COUNT(DISTINCT user_id) FILTER (WHERE status IN ('held','applied'))::int AS pledgers FROM ${PLEDGES} WHERE demand_id = :id`, { id }, t);
    return r;
}

async function propose(userId, b) {
    const [c] = await sel(`SELECT COUNT(*)::int AS n FROM ${DEMANDS} WHERE proposed_by = :u AND status = 'pending'`, { u: userId });
    if (c.n >= PENDING_PROPOSALS_PER_USER) throw fail('LIMIT', `You already have ${PENDING_PROPOSALS_PER_USER} proposals waiting for review`, 409);
    const [[row]] = await run(
        `INSERT INTO ${DEMANDS} (dj_name, genre, club_name, city, state, note, proposed_by) VALUES (:dj, :genre, :club, :city, :state, :note, :u) RETURNING id`,
        { dj: b.djName, genre: b.genre || null, club: b.clubName, city: b.city, state: b.state || null, note: b.note || null, u: userId });
    const [d] = await sel(`SELECT * FROM ${DEMANDS} WHERE id = :id`, { id: row.id });
    return presentDemand(d, await demandStats(row.id));
}

async function listDemandsPublic() {
    const rows = await sel(`SELECT * FROM ${DEMANDS} WHERE status IN ('open','confirmed') ORDER BY (status = 'open') DESC, created_at DESC LIMIT 60`, {});
    const items = [];
    for (const d of rows) items.push(presentDemand(d, await demandStats(d.id)));
    return { items, total: items.length, minPledgePoints: MIN_PLEDGE_POINTS };
}

async function myDemandActivity(userId) {
    const proposals = await sel(`SELECT * FROM ${DEMANDS} WHERE proposed_by = :u ORDER BY created_at DESC LIMIT 20`, { u: userId });
    const pledges = await sel(
        `SELECT p.id, p.demand_id AS "demandId", p.points::bigint AS points, p.status, d.dj_name AS "djName", d.club_name AS "clubName", d.status AS "demandStatus"
           FROM ${PLEDGES} p JOIN ${DEMANDS} d ON d.id = p.demand_id WHERE p.user_id = :u ORDER BY p.created_at DESC LIMIT 50`, { u: userId });
    return {
        proposals: await Promise.all(proposals.map(async (d) => presentDemand(d, await demandStats(d.id)))),
        pledges: pledges.map((p) => ({ ...p, points: Number(p.points) })), balance: await balance(userId),
    };
}

async function pledge(userId, demandId, points) {
    if (!Number.isInteger(points) || points < MIN_PLEDGE_POINTS) throw fail('VALIDATION_ERROR', `The smallest pledge is ${MIN_PLEDGE_POINTS} points`);
    return sequelize.transaction(async (t) => {
        await lockUser(userId, t);
        const [d] = await sel(`SELECT * FROM ${DEMANDS} WHERE id = :id FOR UPDATE`, { id: demandId }, t);
        if (!d || d.status !== 'open') throw fail('NOT_FOUND', 'This demand is not open for pledges', 404);
        if (d.closes_at && new Date(d.closes_at).getTime() <= Date.now()) throw fail('CLOSED', 'Pledges for this demand have closed', 409);
        const have = await balance(userId, t);
        if (have < points) throw fail('INSUFFICIENT_POINTS', `You need ${points} points and have ${have}. Load your wallet first.`, 402, { need: points, have });
        const [[p]] = await run(`INSERT INTO ${PLEDGES} (demand_id, user_id, points) VALUES (:d, :u, :p) RETURNING id`, { d: demandId, u: userId, p: points }, t);
        await ledger(userId, -points, 'dj_pledge', p.id, `Pledge for ${d.dj_name} at ${d.club_name}`, t);
        return presentDemand(d, await demandStats(demandId, t));
    });
}

async function refundPledges(demandId, userId, note, t) {
    const rows = await sel(`SELECT id, user_id, points FROM ${PLEDGES} WHERE demand_id = :d AND status = 'held' ${userId ? 'AND user_id = :u' : ''}`, { d: demandId, u: userId }, t);
    for (const p of rows) {
        await lockUser(p.user_id, t);
        await run(`UPDATE ${PLEDGES} SET status = 'refunded', updated_at = NOW() WHERE id = :id`, { id: p.id }, t);
        await ledger(p.user_id, Number(p.points), 'dj_refund', p.id, note, t);
    }
    return rows.length;
}

async function withdraw(userId, demandId) {
    return sequelize.transaction(async (t) => {
        const [d] = await sel(`SELECT * FROM ${DEMANDS} WHERE id = :id FOR UPDATE`, { id: demandId }, t);
        if (!d || d.status !== 'open') throw fail('CONFLICT', 'Pledges can only be taken back while a demand is open', 409);
        const n = await refundPledges(demandId, userId, 'Pledge taken back', t);
        if (n === 0) throw fail('NOT_FOUND', 'You have no pledge on this demand', 404);
        return { refunded: n, balance: await balance(userId, t) };
    });
}

async function adminListDemands(status) {
    const rows = await sel(`SELECT * FROM ${DEMANDS} ${status ? 'WHERE status = :status' : ''} ORDER BY (status = 'pending') DESC, created_at DESC LIMIT 100`, { status });
    const items = [];
    for (const d of rows) items.push({ ...presentDemand(d, await demandStats(d.id)), proposedBy: String(d.proposed_by) });
    return { items, total: items.length };
}

async function decideDemand(adminId, id, from, to, patch, note, { refund = false, apply = false } = {}) {
    return sequelize.transaction(async (t) => {
        const [d] = await sel(`SELECT * FROM ${DEMANDS} WHERE id = :id FOR UPDATE`, { id }, t);
        if (!d) throw fail('NOT_FOUND', 'Demand not found', 404);
        if (!from.includes(d.status)) throw fail('CONFLICT', `This demand is ${d.status}`, 409);
        if (refund) await refundPledges(id, null, note || 'Demand closed: pledge refunded', t);
        if (apply) await run(`UPDATE ${PLEDGES} SET status = 'applied', updated_at = NOW() WHERE demand_id = :id AND status = 'held'`, { id }, t);
        await run(
            `UPDATE ${DEMANDS} SET status = :to, decided_by = :by, decided_at = NOW(), decision_note = :note,
                    target_points = COALESCE(:target, target_points), closes_at = COALESCE(:closes, closes_at), updated_at = NOW() WHERE id = :id`,
            { id, to, by: adminId, note: note || null, target: patch.targetPoints ?? null, closes: patch.closesAt ?? null }, t);
        const [n] = await sel(`SELECT * FROM ${DEMANDS} WHERE id = :id`, { id }, t);
        return presentDemand(n, await demandStats(id, t));
    });
}
const approveDemand = (a, id, b) => decideDemand(a, id, ['pending'], 'open', { targetPoints: b.targetPoints, closesAt: b.closesAt }, null);
const rejectDemand = (a, id, note) => decideDemand(a, id, ['pending'], 'rejected', {}, note);
const confirmDemand = (a, id, note) => decideDemand(a, id, ['open'], 'confirmed', {}, note, { apply: true });
const closeDemand = (a, id, note) => decideDemand(a, id, ['open'], 'closed', {}, note, { refund: true });

module.exports = {
    pickWinners, MIN_PLEDGE_POINTS,
    createDraw, updateDraw, openDraw, closeDraw, cancelDraw, runDraw, markClaimed, enter, listDrawsPublic, myEntries, adminListDraws, adminGetDraw,
    propose, listDemandsPublic, myDemandActivity, pledge, withdraw, adminListDemands, approveDemand, rejectDemand, confirmDemand, closeDemand,
};
