'use strict';
/**
 * Single-instance leader guard via a Postgres session-level advisory lock.
 *
 * Background sweeps (reconciliation, outbox redrive) are scheduled per-instance.
 * With >1 OES replica that means the same sweep runs N times concurrently. We do
 * NOT want that: drift detection emitting N duplicate alerts, and redrive racing
 * to re-publish the same rows. `pg_try_advisory_lock(key)` lets exactly one
 * instance hold a named lock; the others get `false` and skip the tick cleanly.
 *
 * `pg_try_advisory_lock` is non-blocking: it returns immediately rather than
 * queueing, so a slow/dead leader never stalls the others — they simply skip until
 * the lock frees. The lock is SESSION-scoped, so we MUST run lock+body+unlock on a
 * single dedicated connection (sequelize pooling can otherwise hand the unlock to a
 * different backend, leaking the lock). We always unlock in `finally`.
 *
 * Lock keys are fixed app-chosen bigints (see ADVISORY_LOCK_KEYS). They live in the
 * pg_advisory shared space, so keep them unique within this database.
 */

// Fixed, app-chosen advisory-lock keys. Arbitrary but stable bigints in a range
// unlikely to collide with other apps' ad-hoc locks. Do not reuse across sweeps.
const ADVISORY_LOCK_KEYS = Object.freeze({
    RECONCILIATION: 521001,
    OUTBOX_REDRIVE: 521002,
});

/**
 * Acquire a session advisory lock on `key`, run `fn`, then release it. The lock is
 * taken and released on the SAME dedicated connection. Returns
 *   { acquired: true,  result } when the lock was held and `fn` ran, or
 *   { acquired: false }         when another instance holds it (body NOT run).
 *
 * `sequelize` must be a Sequelize instance. `fn` is the sweep body (no args).
 */
async function withAdvisoryLock(sequelize, key, fn) {
    if (typeof key !== 'number' || !Number.isInteger(key)) {
        throw new TypeError(`withAdvisoryLock: key must be an integer, got ${key}`);
    }
    // A dedicated connection so the lock's session scope is honoured across the
    // try + the unlock. connectionManager is the Sequelize-internal pool accessor.
    const connection = await sequelize.connectionManager.getConnection({ type: 'write' });
    try {
        const tryRes = await connection.query('SELECT pg_try_advisory_lock($1) AS locked', [key]);
        const locked = extractLocked(tryRes);
        if (!locked) return { acquired: false };
        try {
            const result = await fn();
            return { acquired: true, result };
        } finally {
            // Best-effort release; if it throws we still must return the connection.
            try { await connection.query('SELECT pg_advisory_unlock($1)', [key]); }
            catch (e) { process.stderr.write(`[leaderLock] unlock(${key}) failed: ${e.message}\n`); }
        }
    } finally {
        await sequelize.connectionManager.releaseConnection(connection);
    }
}

// node-postgres returns { rows: [...] }; normalise the boolean out of it.
function extractLocked(res) {
    const rows = res && res.rows ? res.rows : res;
    const row = Array.isArray(rows) ? rows[0] : rows;
    return !!(row && (row.locked === true || row.locked === 't'));
}

module.exports = { withAdvisoryLock, ADVISORY_LOCK_KEYS };
