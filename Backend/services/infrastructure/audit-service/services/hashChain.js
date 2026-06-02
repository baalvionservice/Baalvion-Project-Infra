'use strict';
// Tamper-evidence: each audit row is hash-chained to the previous one.
//   hash = SHA256( prev_hash + canonical(row) )
// The canonical form is built from app-controlled fields only (NOT the DB-generated
// seq/event_id/recorded_at) and round-trips deterministically through Postgres, so
// the same hash can be recomputed at verify time. Metadata is stable-stringified
// (recursively sorted keys) so jsonb key reordering can't change the hash.
const crypto = require('crypto');

const GENESIS = '0'.repeat(64);

function stableStringify(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
    if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
    const keys = Object.keys(v).sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
}

function canonical(e) {
    return [
        new Date(e.occurred_at).toISOString(),
        e.actor_id ?? '', e.actor_org_id ?? '', e.ip_address ?? '', e.user_agent ?? '',
        e.action ?? '', e.resource_type ?? '', e.resource_id ?? '', e.tenant_id ?? '', e.scope_id ?? '',
        e.outcome ?? '', e.severity ?? '', e.source_service ?? '', e.app_id ?? '', e.correlation_id ?? '',
        stableStringify(e.metadata ?? {}),
    ].join('|');
}

const sha256hex = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const computeHash = (prevHash, e) => sha256hex(prevHash + canonical(e));

module.exports = { GENESIS, stableStringify, canonical, sha256hex, computeHash };
