'use strict';
const crypto = require('crypto');
const db = require('../models');

const GENESIS = '0'.repeat(64);

// Canonical payload string used for hashing (stable key order).
function canonical(entry) {
    return JSON.stringify({
        tenantId: entry.tenantId,
        actorId: entry.actorId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        metadata: entry.metadata || {},
        createdAt: entry.createdAt,
    });
}

function computeHash(prevHash, entry) {
    return crypto.createHash('sha256').update(prevHash + canonical(entry)).digest('hex');
}

/**
 * Append an audit entry to the hash chain. Non-throwing: an audit failure must
 * never break the underlying business action (errors are logged, not raised).
 */
async function recordAudit({ actorId, action, resourceType, resourceId, metadata = {}, tenantId = 'T-DEMO' }) {
    const t = await db.sequelize.transaction();
    try {
        // Global serialization of chain appends (across processes) — a row-level
        // FOR UPDATE on "latest" can still fork under concurrency, so use a
        // transaction-scoped advisory lock keyed to the audit chain.
        await db.sequelize.query('SELECT pg_advisory_xact_lock(91532)', { transaction: t });
        const last = await db.AuditLog.findOne({ order: [['seq', 'DESC']], transaction: t });
        const prevHash = last ? last.hash : GENESIS;
        const createdAt = new Date().toISOString();
        const entry = { tenantId, actorId: String(actorId || 'system'), action, resourceType, resourceId: String(resourceId || ''), metadata, createdAt };
        const hash = computeHash(prevHash, entry);
        const row = await db.AuditLog.create({ ...entry, prevHash, hash }, { transaction: t });
        await t.commit();
        return row;
    } catch (err) {
        await t.rollback();
        // eslint-disable-next-line no-console
        console.error('[audit] record failed:', err.message);
        return null;
    }
}

// Recompute the chain in seq order; report first break (tamper detection).
async function verifyChain() {
    const rows = await db.AuditLog.findAll({ order: [['seq', 'ASC']] });
    let prevHash = GENESIS;
    for (const row of rows) {
        const expected = computeHash(prevHash, {
            tenantId: row.tenantId, actorId: row.actorId, action: row.action,
            resourceType: row.resourceType, resourceId: row.resourceId,
            metadata: row.metadata, createdAt: row.createdAt,
        });
        if (row.prevHash !== prevHash) return { valid: false, brokenAt: row.seq, reason: 'prevHash mismatch' };
        if (row.hash !== expected) return { valid: false, brokenAt: row.seq, reason: 'hash mismatch (tampered)' };
        prevHash = row.hash;
    }
    return { valid: true, entries: rows.length, headHash: prevHash === GENESIS ? null : prevHash };
}

// One-time chain repair: recompute prevHash/hash sequentially. Use only to
// recover from a chain corrupted by a pre-fix concurrency fork.
async function repairChain() {
    const rows = await db.AuditLog.findAll({ order: [['seq', 'ASC']] });
    let prevHash = GENESIS;
    let fixed = 0;
    for (const row of rows) {
        const hash = computeHash(prevHash, {
            tenantId: row.tenantId, actorId: row.actorId, action: row.action,
            resourceType: row.resourceType, resourceId: row.resourceId,
            metadata: row.metadata, createdAt: row.createdAt,
        });
        if (row.prevHash !== prevHash || row.hash !== hash) { await row.update({ prevHash, hash }); fixed += 1; }
        prevHash = hash;
    }
    return { fixed, total: rows.length, headHash: prevHash === GENESIS ? null : prevHash };
}

module.exports = { recordAudit, verifyChain, repairChain, computeHash, GENESIS };
