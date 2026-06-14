'use strict';
// Feature-flags module service. Mirrors adminService.js conventions exactly:
//   - raw Sequelize via db.sequelize.query with bind params ONLY (never interpolate)
//   - AppError for all operational failures
//   - mutations write an audit row to auth.audit_logs (the shared audit store)
//
// Data lives in a dedicated `admin` schema, self-provisioned via ensureSchema()
// (no migration runner exists in this service). ensureSchema() is memoized so the
// DDL runs at most once per process; every public function awaits it first.

const { AppError } = require('../utils/errors');
const eventBus     = require('../utils/eventBus');
const logger       = require('../utils/logger');

let _db;
function getDb() {
    if (!_db) _db = require('../models');
    return _db;
}

// ── Self-provisioning schema (idempotent + memoized) ──────────────────────────
let _schemaReady = null;
function ensureSchema() {
    if (_schemaReady) return _schemaReady;
    const db = getDb();
    _schemaReady = db.sequelize
        .query(`
            CREATE SCHEMA IF NOT EXISTS admin;
            CREATE TABLE IF NOT EXISTS admin.feature_flags (
                id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                key                TEXT         NOT NULL UNIQUE,
                name               TEXT         NOT NULL,
                description        TEXT,
                enabled            BOOLEAN      NOT NULL DEFAULT FALSE,
                rollout_percentage INTEGER      NOT NULL DEFAULT 100
                    CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
                environments       JSONB        NOT NULL DEFAULT '[]'::jsonb,
                target_org_ids     JSONB        NOT NULL DEFAULT '[]'::jsonb,
                target_user_ids    JSONB        NOT NULL DEFAULT '[]'::jsonb,
                metadata           JSONB        NOT NULL DEFAULT '{}'::jsonb,
                created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_feature_flags_created_at
                ON admin.feature_flags (created_at DESC);
        `)
        .catch((err) => {
            // Reset so a transient failure (e.g. DB not ready) can be retried on the
            // next call rather than caching a rejected promise forever.
            _schemaReady = null;
            throw err;
        });
    return _schemaReady;
}

// ── Serialization: DB row (snake_case) → console shape (camelCase) ────────────
// jsonb columns come back already parsed as JS arrays/objects from node-postgres.
function toArray(v) {
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    if (typeof v === 'string') {
        try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
}
function toObject(v) {
    if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    if (typeof v === 'string') {
        try { const p = JSON.parse(v); return (p && typeof p === 'object' && !Array.isArray(p)) ? p : {}; } catch { return {}; }
    }
    return {};
}

function serialize(row) {
    return {
        id:            String(row.id),
        key:           row.key,
        name:          row.name,
        description:   row.description == null ? undefined : row.description,
        enabled:       !!row.enabled,
        rolloutPercent: row.rollout_percentage == null ? 100 : parseInt(row.rollout_percentage, 10),
        environments:  toArray(row.environments),
        targetOrgIds:  toArray(row.target_org_ids),
        targetUserIds: toArray(row.target_user_ids),
        metadata:      toObject(row.metadata),
        createdAt:     row.created_at,
        updatedAt:     row.updated_at,
    };
}

const SELECT_COLS = `id, key, name, description, enabled, rollout_percentage,
                     environments, target_org_ids, target_user_ids, metadata,
                     created_at, updated_at`;

// ── Validation helpers ────────────────────────────────────────────────────────
const KEY_RE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function normalizeKey(rawKey) {
    const key = typeof rawKey === 'string' ? rawKey.trim().toLowerCase() : '';
    if (!key || key.length > 200 || !KEY_RE.test(key)) {
        throw new AppError(
            'VALIDATION_ERROR',
            'Invalid key: use lowercase letters, numbers and . _ - separators (max 200 chars)',
            400,
        );
    }
    return key;
}

function normalizeName(rawName) {
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    if (!name || name.length > 255) {
        throw new AppError('VALIDATION_ERROR', 'Flag name is required (max 255 chars)', 400);
    }
    return name;
}

function normalizeRollout(raw) {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 100) {
        throw new AppError('VALIDATION_ERROR', 'rolloutPercent must be an integer between 0 and 100', 400);
    }
    return n;
}

function normalizeStringArray(raw, field) {
    if (raw == null) return [];
    if (!Array.isArray(raw)) {
        throw new AppError('VALIDATION_ERROR', `${field} must be an array`, 400);
    }
    return raw.map((v) => String(v));
}

function normalizeMetadata(raw) {
    if (raw == null) return {};
    if (typeof raw !== 'object' || Array.isArray(raw)) {
        throw new AppError('VALIDATION_ERROR', 'metadata must be an object', 400);
    }
    return raw;
}

// ── Audit (mirrors adminService: writes to the shared auth.audit_logs store) ──
async function audit(action, flagId, metadata, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';
    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, action, resource_type, resource_id, metadata, ip_address)
         VALUES ($1, $2, 'feature_flag', $3, $4, $5)`,
        { bind: [adminUserId, action, flagId == null ? null : String(flagId), JSON.stringify(metadata || {}), ip] },
    );
}

// ── Read ──────────────────────────────────────────────────────────────────────
async function listFlags({ page = 1, limit = 50 } = {}) {
    await ensureSchema();
    const db     = getDb();
    const offset = (page - 1) * limit;

    const [rows, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT ${SELECT_COLS}
             FROM admin.feature_flags
             ORDER BY created_at DESC
             LIMIT $1 OFFSET $2`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [limit, offset] },
        ),
        db.sequelize.query(
            'SELECT COUNT(*)::int AS count FROM admin.feature_flags',
            { type: db.Sequelize.QueryTypes.SELECT },
        ),
    ]);

    return { items: rows.map(serialize), total: count, page, limit, hasMore: offset + limit < count };
}

async function getFlag(id) {
    await ensureSchema();
    const db = getDb();
    const [row] = await db.sequelize.query(
        `SELECT ${SELECT_COLS} FROM admin.feature_flags WHERE id = $1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] },
    );
    if (!row) throw new AppError('NOT_FOUND', 'Feature flag not found', 404);
    return serialize(row);
}

// ── Create ──────────────────────────────────────────────────────────────────
async function createFlag(payload, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const key  = normalizeKey(payload.key);
    const name = normalizeName(payload.name);
    const description = payload.description == null ? null : String(payload.description).trim() || null;
    const enabled = payload.enabled === undefined ? false : !!payload.enabled;
    const rollout = payload.rolloutPercent === undefined ? 100 : normalizeRollout(payload.rolloutPercent);
    const environments  = normalizeStringArray(payload.environments, 'environments');
    const targetOrgIds  = normalizeStringArray(payload.targetOrgIds, 'targetOrgIds');
    const targetUserIds = normalizeStringArray(payload.targetUserIds, 'targetUserIds');
    const metadata      = normalizeMetadata(payload.metadata);

    // Friendly pre-check; the UNIQUE constraint is the authoritative guard against races.
    const [existing] = await db.sequelize.query(
        'SELECT id FROM admin.feature_flags WHERE key = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [key] },
    );
    if (existing) throw new AppError('CONFLICT', 'A feature flag with that key already exists', 409);

    let created;
    try {
        [created] = await db.sequelize.query(
            `INSERT INTO admin.feature_flags
                (key, name, description, enabled, rollout_percentage,
                 environments, target_org_ids, target_user_ids, metadata)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb)
             RETURNING ${SELECT_COLS}`,
            {
                type: db.Sequelize.QueryTypes.SELECT,
                bind: [
                    key, name, description, enabled, rollout,
                    JSON.stringify(environments), JSON.stringify(targetOrgIds),
                    JSON.stringify(targetUserIds), JSON.stringify(metadata),
                ],
            },
        );
    } catch (err) {
        if (err && /unique/i.test(err.message || '')) {
            throw new AppError('CONFLICT', 'A feature flag with that key already exists', 409);
        }
        throw err;
    }

    await audit('feature_flag.created', created.id, { key, name, enabled, createdBy: adminUserId }, adminUserId, ipAddress);
    logger.info({ flagId: created.id, key, adminUserId, event: 'admin.feature_flag_created' }, 'Feature flag created');
    eventBus.publish('admin.feature_flag.created', { id: String(created.id), key, enabled }).catch(() => {});

    return serialize(created);
}

// ── Update (also serves toggle — toggle is just { enabled }) ──────────────────
async function updateFlag(id, patch, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const [existing] = await db.sequelize.query(
        'SELECT id FROM admin.feature_flags WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] },
    );
    if (!existing) throw new AppError('NOT_FOUND', 'Feature flag not found', 404);

    const sets    = [];
    const bind    = [];
    const changed = {};

    if (patch.key !== undefined) {
        const key = normalizeKey(patch.key);
        const [dupe] = await db.sequelize.query(
            'SELECT id FROM admin.feature_flags WHERE key = $1 AND id <> $2',
            { type: db.Sequelize.QueryTypes.SELECT, bind: [key, id] },
        );
        if (dupe) throw new AppError('CONFLICT', 'A feature flag with that key already exists', 409);
        sets.push(`key = $${bind.length + 1}`); bind.push(key); changed.key = key;
    }
    if (patch.name !== undefined) {
        const name = normalizeName(patch.name);
        sets.push(`name = $${bind.length + 1}`); bind.push(name); changed.name = name;
    }
    if (patch.description !== undefined) {
        const description = patch.description == null ? null : String(patch.description).trim() || null;
        sets.push(`description = $${bind.length + 1}`); bind.push(description); changed.description = description;
    }
    if (patch.enabled !== undefined) {
        const enabled = !!patch.enabled;
        sets.push(`enabled = $${bind.length + 1}`); bind.push(enabled); changed.enabled = enabled;
    }
    if (patch.rolloutPercent !== undefined) {
        const rollout = normalizeRollout(patch.rolloutPercent);
        sets.push(`rollout_percentage = $${bind.length + 1}`); bind.push(rollout); changed.rolloutPercent = rollout;
    }
    if (patch.environments !== undefined) {
        const environments = normalizeStringArray(patch.environments, 'environments');
        sets.push(`environments = $${bind.length + 1}::jsonb`); bind.push(JSON.stringify(environments)); changed.environments = environments;
    }
    if (patch.targetOrgIds !== undefined) {
        const targetOrgIds = normalizeStringArray(patch.targetOrgIds, 'targetOrgIds');
        sets.push(`target_org_ids = $${bind.length + 1}::jsonb`); bind.push(JSON.stringify(targetOrgIds)); changed.targetOrgIds = targetOrgIds;
    }
    if (patch.targetUserIds !== undefined) {
        const targetUserIds = normalizeStringArray(patch.targetUserIds, 'targetUserIds');
        sets.push(`target_user_ids = $${bind.length + 1}::jsonb`); bind.push(JSON.stringify(targetUserIds)); changed.targetUserIds = targetUserIds;
    }
    if (patch.metadata !== undefined) {
        const metadata = normalizeMetadata(patch.metadata);
        sets.push(`metadata = $${bind.length + 1}::jsonb`); bind.push(JSON.stringify(metadata)); changed.metadata = metadata;
    }

    if (sets.length === 0) {
        throw new AppError(
            'VALIDATION_ERROR',
            'No updatable fields provided (key, name, description, enabled, rolloutPercent, environments, targetOrgIds, targetUserIds, metadata)',
            400,
        );
    }

    sets.push('updated_at = NOW()');
    bind.push(id);

    let updated;
    try {
        [updated] = await db.sequelize.query(
            `UPDATE admin.feature_flags SET ${sets.join(', ')}
             WHERE id = $${bind.length}
             RETURNING ${SELECT_COLS}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind },
        );
    } catch (err) {
        if (err && /unique/i.test(err.message || '')) {
            throw new AppError('CONFLICT', 'A feature flag with that key already exists', 409);
        }
        throw err;
    }

    await audit('feature_flag.updated', id, { changed, updatedBy: adminUserId }, adminUserId, ipAddress);
    logger.info({ flagId: id, adminUserId, event: 'admin.feature_flag_updated' }, 'Feature flag updated');
    eventBus.publish('admin.feature_flag.updated', { id: String(id), changed }).catch(() => {});

    return serialize(updated);
}

// ── Delete (hard delete — a flag definition has no soft-delete column) ─────────
async function deleteFlag(id, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const [existing] = await db.sequelize.query(
        'SELECT id, key FROM admin.feature_flags WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] },
    );
    if (!existing) throw new AppError('NOT_FOUND', 'Feature flag not found', 404);

    // Audit before delete so resource detail is captured.
    await audit('feature_flag.deleted', id, { key: existing.key, deletedBy: adminUserId }, adminUserId, ipAddress);

    await db.sequelize.query(
        'DELETE FROM admin.feature_flags WHERE id = $1',
        { bind: [id] },
    );

    logger.warn({ flagId: id, key: existing.key, adminUserId, event: 'admin.feature_flag_deleted' }, 'Feature flag deleted');
    eventBus.publish('admin.feature_flag.deleted', { id: String(id), key: existing.key }).catch(() => {});

    return { id: String(id), deleted: true };
}

module.exports = {
    ensureSchema,
    listFlags,
    getFlag,
    createFlag,
    updateFlag,
    deleteFlag,
};
