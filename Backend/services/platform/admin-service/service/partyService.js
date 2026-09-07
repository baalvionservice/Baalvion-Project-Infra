'use strict';
/**
 * The party graph — one identity per human across every property.
 *
 * Resolution logic lives in @baalvion/party (pure, tested in isolation); this file is the
 * storage and the concurrency handling around it.
 *
 * **Concurrency matters here more than it looks.** Two payments for the same person can arrive
 * at once — a subscription renewal on one site and a purchase on another. Resolving with a
 * read-then-write would let both see "no party" and create two, permanently splitting one
 * customer. So a party is claimed by inserting its strongest key with ON CONFLICT DO NOTHING:
 * exactly one writer wins, and the loser reads the winner's id instead of creating a rival.
 *
 * Ambiguous cases are never guessed. They go to a review queue, because a wrong merge joins two
 * people's payment history and entitlements and is very hard to unpick.
 */
const crypto = require('crypto');
const { resolveParty, normalizeEmail } = require('@baalvion/party');

let _db;
function db() {
    if (!_db) _db = require('../models');
    return _db;
}

const DDL = `
CREATE SCHEMA IF NOT EXISTS admin;
CREATE TABLE IF NOT EXISTS admin.parties (
    party_id      UUID         PRIMARY KEY,
    display_name  TEXT,
    primary_email TEXT,
    status        VARCHAR(16)  NOT NULL DEFAULT 'active',
    merged_into   UUID,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS admin.party_keys (
    key         VARCHAR(400) PRIMARY KEY,
    party_id    UUID         NOT NULL,
    strength    VARCHAR(8)   NOT NULL,
    first_site  VARCHAR(64),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_party_keys_party ON admin.party_keys (party_id);
CREATE TABLE IF NOT EXISTS admin.party_review_queue (
    id          UUID         PRIMARY KEY,
    reason      TEXT         NOT NULL,
    signal      JSONB        NOT NULL,
    conflicts   JSONB        NOT NULL,
    site_id     VARCHAR(64),
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_party_review_open ON admin.party_review_queue (created_at DESC) WHERE resolved_at IS NULL;
`;

let schemaReady = null;
function ensureSchema() {
    if (!schemaReady) {
        schemaReady = db().sequelize.query(DDL).catch((err) => { schemaReady = null; throw err; });
    }
    return schemaReady;
}

/** Look up every party already known by any of these keys. */
async function candidatesFor(keys) {
    if (keys.length === 0) return [];
    const [rows] = await db().sequelize.query(
        `SELECT k.party_id, p.created_at,
                ARRAY(SELECT key FROM admin.party_keys WHERE party_id = k.party_id) AS keys
           FROM admin.party_keys k
           JOIN admin.parties p ON p.party_id = k.party_id
          WHERE k.key = ANY($1) AND p.status = 'active'`,
        { bind: [keys] },
    );
    return rows.map((r) => ({ partyId: r.party_id, keys: r.keys || [], createdAt: r.created_at }));
}

/**
 * Attach keys to a party in ONE round trip.
 *
 * This used to loop with an INSERT per key. Every payment carries two or three keys, so on a
 * busy consumer that was two or three network round trips per payment spent on writes that
 * could travel together — measured at roughly a third of the consumer's total time.
 */
async function attachKeys(partyId, keys, siteId, transaction) {
    if (!keys || keys.length === 0) return;
    const values = [];
    const bind = [partyId, siteId || null];
    for (const k of keys) {
        bind.push(k.key, k.strength);
        values.push(`($${bind.length - 1}, $1, $${bind.length}, $2)`);
    }
    await db().sequelize.query(
        `INSERT INTO admin.party_keys (key, party_id, strength, first_site)
         VALUES ${values.join(', ')} ON CONFLICT (key) DO NOTHING`,
        { bind, ...(transaction ? { transaction } : {}) },
    );
}

async function queueForReview({ reason, signal, conflicts, siteId }) {
    await db().sequelize.query(
        `INSERT INTO admin.party_review_queue (id, reason, signal, conflicts, site_id)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)`,
        { bind: [crypto.randomUUID(), reason, JSON.stringify(signal), JSON.stringify(conflicts || []), siteId || null] },
    );
}

/**
 * Resolve a customer signal to a party id, creating one if needed.
 *
 * Returns null when there is nothing identifying to resolve — a guest checkout with no email is
 * genuinely unattributable, and inventing a party for it would inflate the customer count with
 * one-payment ghosts.
 */
async function resolveFromSignal(signal) {
    await ensureSchema();
    if (!signal || !signal.siteId) return null;

    const initial = resolveParty(signal, []);
    if (initial.keys.length === 0) return null;

    const candidates = await candidatesFor(initial.keys.map((k) => k.key));
    const decision = resolveParty(signal, candidates);

    if (decision.outcome === 'AMBIGUOUS') {
        // Two verified signals disagreeing is a real data question, not something to guess at.
        await queueForReview({ reason: decision.reason, signal, conflicts: decision.conflicts, siteId: signal.siteId });
        return null;
    }

    if (decision.outcome === 'MATCHED' || decision.outcome === 'UNVERIFIED') {
        if (decision.outcome === 'UNVERIFIED') {
            // Attached provisionally, but a human should confirm: an unverified email is a claim.
            await queueForReview({ reason: decision.reason, signal, conflicts: [decision.partyId], siteId: signal.siteId });
        }
        // Only verified keys are attached to an existing party — a weak key must not silently
        // become another way to reach someone else's identity.
        await attachKeys(decision.partyId, decision.keys.filter((k) => k.strength === 'STRONG'), signal.siteId);
        return decision.partyId;
    }

    // NEW — claim the strongest key first. Whoever wins the insert owns the party; a concurrent
    // writer for the same person reads the winner rather than creating a rival.
    const strong = decision.keys.filter((k) => k.strength === 'STRONG');
    const claimKey = strong[0] || decision.keys[0];
    const partyId = crypto.randomUUID();

    await db().sequelize.query(
        'INSERT INTO admin.parties (party_id, display_name, primary_email) VALUES ($1, $2, $3)',
        { bind: [partyId, signal.name || null, normalizeEmail(signal.email) || null] },
    );
    const [claimed] = await db().sequelize.query(
        `INSERT INTO admin.party_keys (key, party_id, strength, first_site)
         VALUES ($1, $2, $3, $4) ON CONFLICT (key) DO NOTHING
         RETURNING party_id`,
        { bind: [claimKey.key, partyId, claimKey.strength, signal.siteId] },
    );

    if (Array.isArray(claimed) && claimed.length > 0) {
        await attachKeys(partyId, strong.filter((k) => k.key !== claimKey.key), signal.siteId);
        return partyId;
    }

    // Lost the race. Adopt the winner and retire the party just created, rather than leaving an
    // orphan that would show as a second customer.
    const [existing] = await db().sequelize.query(
        'SELECT party_id FROM admin.party_keys WHERE key = $1', { bind: [claimKey.key] },
    );
    const winner = existing && existing[0] ? existing[0].party_id : null;
    await db().sequelize.query(
        "UPDATE admin.parties SET status = 'merged', merged_into = $2, updated_at = NOW() WHERE party_id = $1",
        { bind: [partyId, winner] },
    );
    if (winner) await attachKeys(winner, strong, signal.siteId);
    return winner;
}

/** Resolve from a `payment.recorded` payload. Returns null when nothing identifying was sent. */
async function resolveFromPayment(payload) {
    if (payload.partyId) return payload.partyId; // the producer already knew
    const c = payload.customer;
    if (!c) return null;
    return resolveFromSignal({
        siteId: payload.siteId,
        authUserId: c.authUserId,
        email: c.email,
        emailVerified: c.emailVerified === true,
        phone: c.phone,
        phoneVerified: c.phoneVerified === true,
        name: c.name,
        siteCustomerId: c.siteCustomerId,
    });
}

/** Everything a party has paid, across every property — the question the graph exists to answer. */
async function paymentsForParty(partyId, { limit = 100 } = {}) {
    await ensureSchema();
    const [rows] = await db().sequelize.query(
        'SELECT * FROM admin.payment_records WHERE party_id = $1 ORDER BY occurred_at DESC LIMIT $2',
        { bind: [partyId, Math.min(Math.max(Number(limit) || 100, 1), 500)] },
    );
    return rows;
}

async function openReviews({ limit = 50 } = {}) {
    await ensureSchema();
    const [rows] = await db().sequelize.query(
        'SELECT * FROM admin.party_review_queue WHERE resolved_at IS NULL ORDER BY created_at DESC LIMIT $1',
        { bind: [Math.min(Math.max(Number(limit) || 50, 1), 200)] },
    );
    return rows;
}

/**
 * Settle a queued review.
 *
 * `merge` joins the signal's party into the survivor (the oldest, so long-held references stay
 * valid); `separate` records that they are genuinely different people so the same pair is not
 * re-queued forever; `dismiss` closes it with no identity change.
 *
 * Merging is deliberately explicit and human-triggered — it is the operation that joins two
 * people's payment history, and nothing in this system does it automatically on a weak signal.
 */
async function resolveReview(reviewId, { action, survivorId, actorId } = {}) {
    await ensureSchema();
    const [[review]] = await db().sequelize.query(
        'SELECT * FROM admin.party_review_queue WHERE id = $1 AND resolved_at IS NULL',
        { bind: [reviewId] },
    );
    if (!review) return { resolved: false, reason: 'not_found_or_already_resolved' };

    let moved = 0;
    // ONE transaction. A merge touches three tables — identity keys, the party rows and the
    // payment history — and a half-applied merge is the worst possible outcome: keys pointing
    // one way, money another, with no way to tell which half ran.
    await db().sequelize.transaction(async (t) => {
        if (action === 'merge') {
            const conflicts = Array.isArray(review.conflicts) ? review.conflicts : [];
            const ids = [...new Set([survivorId, ...conflicts].filter(Boolean))];
            if (!survivorId || ids.length < 2) {
                const err = new Error('merge needs a survivor and at least one other party');
                err.userReason = err.message;
                throw err;
            }
            const losers = ids.filter((id) => id !== survivorId);

            // The survivor must actually exist and still be active — merging into a party that
            // was itself merged away would chain the history somewhere invisible.
            const [[survivor]] = await db().sequelize.query(
                "SELECT party_id, status FROM admin.parties WHERE party_id = $1 FOR UPDATE",
                { bind: [survivorId], transaction: t },
            );
            if (!survivor || survivor.status !== 'active') {
                const err = new Error(`survivor ${survivorId} is not an active party`);
                err.userReason = err.message;
                throw err;
            }

            // Keys move to the survivor so future lookups land on it directly.
            await db().sequelize.query(
                'UPDATE admin.party_keys SET party_id = $1 WHERE party_id = ANY($2)',
                { bind: [survivorId, losers], transaction: t },
            );
            // The losing rows are kept, not deleted: an id referenced by a ledger line or an
            // entitlement grant must still resolve to something.
            await db().sequelize.query(
                "UPDATE admin.parties SET status = 'merged', merged_into = $1, updated_at = NOW() WHERE party_id = ANY($2)",
                { bind: [survivorId, losers], transaction: t },
            );
            // Payment history follows the survivor, which is the point of merging at all.
            const [, meta] = await db().sequelize.query(
                'UPDATE admin.payment_records SET party_id = $1 WHERE party_id = ANY($2)',
                { bind: [survivorId, losers], transaction: t },
            );
            moved = (meta && meta.rowCount) || 0;
        }

        await db().sequelize.query(
            `UPDATE admin.party_review_queue
                SET resolved_at = NOW(),
                    reason = reason || ' | resolved: ' || $2 || COALESCE(' by ' || $3, '')
              WHERE id = $1`,
            { bind: [reviewId, String(action || 'dismiss'), actorId || null], transaction: t },
        );
    }).catch((err) => {
        if (err.userReason) return Promise.reject(Object.assign(new Error(err.userReason), { userReason: err.userReason }));
        throw err;
    });

    // Moving one person's payment history onto another is exactly the operation someone will
    // ask about later, so it is logged with who did it and how much moved.
    console.info(JSON.stringify({
        evt: 'party.review_resolved', reviewId, action: action || 'dismiss',
        survivorId: survivorId || null, paymentsMoved: moved, actorId: actorId || null,
    }));
    return { resolved: true, action: action || 'dismiss', paymentsMoved: moved };
}

/** One party with its keys and its cross-estate payment history. */
async function partyDetail(partyId) {
    await ensureSchema();
    const [[party]] = await db().sequelize.query(
        'SELECT * FROM admin.parties WHERE party_id = $1', { bind: [partyId] },
    );
    if (!party) return null;
    const [keys] = await db().sequelize.query(
        'SELECT key, strength, first_site, created_at FROM admin.party_keys WHERE party_id = $1 ORDER BY created_at',
        { bind: [partyId] },
    );
    return { party, keys, payments: await paymentsForParty(partyId) };
}

module.exports = {
    ensureSchema,
    resolveFromSignal,
    resolveFromPayment,
    paymentsForParty,
    openReviews,
    resolveReview,
    partyDetail,
};
