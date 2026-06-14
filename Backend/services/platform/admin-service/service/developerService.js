'use strict';
// Developer Platform module service. Mirrors adminService.js conventions exactly:
//   - raw Sequelize via db.sequelize.query with bind params ONLY (never interpolate)
//   - AppError for all operational failures
//   - mutations write an audit row to auth.audit_logs (the shared audit store)
//
// Domain data (webhooks / deliveries / sandboxes) lives in a dedicated `admin` schema,
// self-provisioned via ensureSchema() (no migration runner exists in this service).
// ensureSchema() is memoized so the DDL runs at most once per process; every public
// function awaits it first.
//
// API-usage stats are derived LIVE from real platform data (auth.audit_logs) when
// available, else honest zeros. The changelog and SDK registry are a STATIC real
// catalog returned from code (NOT fabricated per-call metrics, NOT seeded rows).

const crypto       = require('crypto');
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

            CREATE TABLE IF NOT EXISTS admin.dev_webhooks (
                id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                url         TEXT         NOT NULL,
                description TEXT,
                events      JSONB        NOT NULL DEFAULT '[]'::jsonb,
                secret      TEXT         NOT NULL,
                active      BOOLEAN      NOT NULL DEFAULT TRUE,
                org_id      UUID,
                created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_dev_webhooks_created_at
                ON admin.dev_webhooks (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_dev_webhooks_org_id
                ON admin.dev_webhooks (org_id);

            CREATE TABLE IF NOT EXISTS admin.dev_webhook_deliveries (
                id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                webhook_id    UUID         NOT NULL REFERENCES admin.dev_webhooks (id) ON DELETE CASCADE,
                event         TEXT         NOT NULL,
                status        TEXT         NOT NULL DEFAULT 'pending',
                status_code   INTEGER,
                attempts      INTEGER      NOT NULL DEFAULT 0,
                latency_ms    INTEGER,
                response_body TEXT,
                next_retry_at TIMESTAMPTZ,
                payload       JSONB        NOT NULL DEFAULT '{}'::jsonb,
                created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_dev_webhook_deliveries_webhook_id
                ON admin.dev_webhook_deliveries (webhook_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_dev_webhook_deliveries_status
                ON admin.dev_webhook_deliveries (status);

            CREATE TABLE IF NOT EXISTS admin.dev_sandboxes (
                id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                name        TEXT         NOT NULL,
                owner       UUID,
                org_id      UUID,
                status      TEXT         NOT NULL DEFAULT 'running',
                base_url    TEXT,
                expires_at  TIMESTAMPTZ,
                created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_dev_sandboxes_created_at
                ON admin.dev_sandboxes (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_dev_sandboxes_owner
                ON admin.dev_sandboxes (owner);
        `)
        .catch((err) => {
            // Reset so a transient failure (e.g. DB not ready) can be retried on the
            // next call rather than caching a rejected promise forever.
            _schemaReady = null;
            throw err;
        });
    return _schemaReady;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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
function toIso(v) { return v ? new Date(v).toISOString() : null; }

function paginate(items, total, page, limit) {
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
    return {
        success: true,
        data: items,
        pagination: {
            page, limit, total,
            totalPages,
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    };
}

// ── Serializers (DB snake_case → console camelCase, matching developer.types.ts) ─
function serializeWebhook(row, successRate = 0, lastTriggeredAt = null) {
    return {
        id:              String(row.id),
        url:             row.url,
        description:     row.description || '',
        events:          toArray(row.events),
        secret:          row.secret,
        enabled:         !!row.active,
        orgId:           row.org_id ? String(row.org_id) : null,
        successRate,
        lastTriggeredAt: toIso(lastTriggeredAt),
        createdAt:       toIso(row.created_at),
    };
}

function serializeDelivery(row) {
    return {
        id:           String(row.id),
        endpointId:   String(row.webhook_id),
        eventType:    row.event,
        payload:      toObject(row.payload),
        statusCode:   row.status_code == null ? null : Number(row.status_code),
        responseBody: row.response_body == null ? null : row.response_body,
        latencyMs:    row.latency_ms == null ? null : Number(row.latency_ms),
        attempts:     row.attempts == null ? 0 : Number(row.attempts),
        nextRetryAt:  toIso(row.next_retry_at),
        status:       row.status,
        createdAt:    toIso(row.created_at),
    };
}

function serializeSandbox(row) {
    const base = row.base_url || `https://sandbox.baalvion.dev/${row.id}`;
    return {
        id:        String(row.id),
        name:      row.name,
        orgId:     row.org_id ? String(row.org_id) : null,
        status:    row.status,
        baseUrl:   base,
        resetUrl:  `${base}/reset`,
        expiresAt: toIso(row.expires_at),
        createdAt: toIso(row.created_at),
    };
}

// ── Validation helpers ─────────────────────────────────────────────────────────
function isHttpUrl(value) {
    try {
        const u = new URL(String(value));
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch { return false; }
}

const VALID_DELIVERY_STATUS = ['pending', 'success', 'failed', 'retrying'];

// ── API usage stats (derived LIVE from real data, honest zeros otherwise) ───────
const PERIOD_INTERVAL = { '1d': '1 day', '7d': '7 days', '30d': '30 days' };

async function getApiStats({ period = '7d' } = {}) {
    await ensureSchema();
    const db = getDb();
    const interval = PERIOD_INTERVAL[period] || PERIOD_INTERVAL['7d'];

    // Derive endpoint-level usage from real audit-log volume. auth.audit_logs is the
    // only platform-wide activity ledger admin-service can read. We map distinct audit
    // actions to synthetic endpoint rows so the console shows REAL volume signal rather
    // than fabricated numbers. If the table is empty, every count is an honest zero.
    let rows = [];
    try {
        rows = await db.sequelize.query(
            `SELECT a.action AS action,
                    COUNT(*)::int AS calls,
                    COUNT(*) FILTER (WHERE a.action LIKE '%failed%' OR a.action LIKE '%error%')::int AS errors
             FROM auth.audit_logs a
             WHERE a.created_at > NOW() - $1::interval
             GROUP BY a.action
             ORDER BY calls DESC
             LIMIT 20`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [interval] }
        );
    } catch (err) {
        // No audit table / unreadable → honest empty stats rather than a 500.
        logger.warn({ err: err.message, event: 'developer.api_stats_degraded' }, 'API stats source unavailable; returning zeros');
        rows = [];
    }

    const endpoints = rows.map((r) => ({
        endpoint:    `/v1/${String(r.action).replace(/\./g, '/')}`,
        method:      inferMethod(r.action),
        callsToday:  Number(r.calls) || 0,
        errorsToday: Number(r.errors) || 0,
        p95Ms:       0,   // no real latency telemetry in admin-service → honest 0
        trend:       'stable',
    }));

    const totalCalls  = endpoints.reduce((s, e) => s + e.callsToday, 0);
    const totalErrors = endpoints.reduce((s, e) => s + e.errorsToday, 0);

    return { endpoints, totalCalls, totalErrors, avgLatencyMs: 0 };
}

function inferMethod(action) {
    const a = String(action);
    if (/\.(created|registered|started|requested|invited)$/.test(a)) return 'POST';
    if (/\.(updated|suspended|unsuspended)$/.test(a))                return 'PATCH';
    if (/\.(deleted|revoked|removed)$/.test(a))                      return 'DELETE';
    return 'GET';
}

// ── Webhooks: CRUD ──────────────────────────────────────────────────────────────
async function listWebhooks({ page = 1, limit = 50, orgId } = {}) {
    await ensureSchema();
    const db = getDb();
    const offset = (page - 1) * limit;

    const where = ['1=1'];
    const bind  = [];
    if (orgId) { where.push(`w.org_id = $${bind.length + 1}`); bind.push(orgId); }
    const whereSql = where.join(' AND ');

    const [rows, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT w.id, w.url, w.description, w.events, w.secret, w.active, w.org_id, w.created_at,
                    COUNT(d.id)::int AS total_deliveries,
                    COUNT(d.id) FILTER (WHERE d.status = 'success')::int AS success_deliveries,
                    MAX(d.created_at) AS last_triggered_at
             FROM admin.dev_webhooks w
             LEFT JOIN admin.dev_webhook_deliveries d ON d.webhook_id = w.id
             WHERE ${whereSql}
             GROUP BY w.id
             ORDER BY w.created_at DESC
             LIMIT $${bind.length + 1} OFFSET $${bind.length + 2}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [...bind, limit, offset] }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS count FROM admin.dev_webhooks w WHERE ${whereSql}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind }
        ),
    ]);

    const items = rows.map((r) => {
        const total = Number(r.total_deliveries) || 0;
        const ok    = Number(r.success_deliveries) || 0;
        const rate  = total > 0 ? ok / total : 0;
        return serializeWebhook(r, rate, r.last_triggered_at);
    });

    return paginate(items, count, page, limit);
}

async function getWebhook(id) {
    await ensureSchema();
    const db = getDb();
    const [row] = await db.sequelize.query(
        `SELECT w.id, w.url, w.description, w.events, w.secret, w.active, w.org_id, w.created_at,
                COUNT(d.id)::int AS total_deliveries,
                COUNT(d.id) FILTER (WHERE d.status = 'success')::int AS success_deliveries,
                MAX(d.created_at) AS last_triggered_at
         FROM admin.dev_webhooks w
         LEFT JOIN admin.dev_webhook_deliveries d ON d.webhook_id = w.id
         WHERE w.id = $1
         GROUP BY w.id`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] }
    );
    if (!row) throw new AppError('NOT_FOUND', 'Webhook not found', 404);
    const total = Number(row.total_deliveries) || 0;
    const ok    = Number(row.success_deliveries) || 0;
    return serializeWebhook(row, total > 0 ? ok / total : 0, row.last_triggered_at);
}

async function createWebhook(input, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const url = typeof input.url === 'string' ? input.url.trim() : '';
    if (!url || !isHttpUrl(url)) {
        throw new AppError('VALIDATION_ERROR', 'A valid http(s) webhook url is required', 400);
    }
    const events = toArray(input.events).map((e) => String(e).trim()).filter(Boolean);
    if (events.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'At least one event must be supplied', 400);
    }
    const description = input.description != null ? String(input.description).trim() : null;
    const orgId = (input.orgId != null && String(input.orgId).trim() !== '') ? String(input.orgId).trim() : null;

    // A signing secret is required for HMAC verification at delivery time. Generate one
    // when the caller does not provide it (the console does not collect it on create).
    const secret = (input.secret && String(input.secret).trim() !== '')
        ? String(input.secret).trim()
        : `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const [created] = await db.sequelize.query(
        `INSERT INTO admin.dev_webhooks (url, description, events, secret, active, org_id)
         VALUES ($1, $2, $3::jsonb, $4, $5, $6)
         RETURNING id, url, description, events, secret, active, org_id, created_at`,
        {
            type: db.Sequelize.QueryTypes.SELECT,
            bind: [url, description, JSON.stringify(events), secret, input.enabled === false ? false : true, orgId],
        }
    );

    await writeAudit(db, {
        userId: adminUserId, orgId,
        action: 'developer.webhook_created', resourceType: 'webhook', resourceId: created.id,
        metadata: { url, events, createdBy: adminUserId }, ip,
    });
    eventBus.publish('developer.webhook_created', { id: String(created.id), url, events, createdBy: String(adminUserId) }).catch(() => {});
    logger.info({ webhookId: created.id, adminUserId, event: 'developer.webhook_created' }, 'Webhook created by admin');

    return serializeWebhook(created, 0, null);
}

async function updateWebhook(id, patch, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [existing] = await db.sequelize.query(
        'SELECT id, org_id FROM admin.dev_webhooks WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] }
    );
    if (!existing) throw new AppError('NOT_FOUND', 'Webhook not found', 404);

    const sets = [];
    const bind = [];
    const changed = {};

    if (patch.url !== undefined) {
        const url = String(patch.url).trim();
        if (!isHttpUrl(url)) throw new AppError('VALIDATION_ERROR', 'A valid http(s) webhook url is required', 400);
        sets.push(`url = $${bind.length + 1}`); bind.push(url); changed.url = url;
    }
    if (patch.description !== undefined) {
        const d = patch.description == null ? null : String(patch.description).trim();
        sets.push(`description = $${bind.length + 1}`); bind.push(d || null); changed.description = d || null;
    }
    if (patch.events !== undefined) {
        const events = toArray(patch.events).map((e) => String(e).trim()).filter(Boolean);
        if (events.length === 0) throw new AppError('VALIDATION_ERROR', 'At least one event must be supplied', 400);
        sets.push(`events = $${bind.length + 1}::jsonb`); bind.push(JSON.stringify(events)); changed.events = events;
    }
    // The console's WebhookEndpoint uses `enabled`; persist it to the `active` column.
    if (patch.enabled !== undefined) {
        const enabled = !!patch.enabled;
        sets.push(`active = $${bind.length + 1}`); bind.push(enabled); changed.enabled = enabled;
    }

    if (sets.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'No updatable fields provided (url, description, events, enabled)', 400);
    }

    sets.push('updated_at = NOW()');
    bind.push(id);

    const [updated] = await db.sequelize.query(
        `UPDATE admin.dev_webhooks SET ${sets.join(', ')}
         WHERE id = $${bind.length}
         RETURNING id, url, description, events, secret, active, org_id, created_at`,
        { type: db.Sequelize.QueryTypes.SELECT, bind }
    );

    await writeAudit(db, {
        userId: adminUserId, orgId: existing.org_id,
        action: 'developer.webhook_updated', resourceType: 'webhook', resourceId: id,
        metadata: { changed, updatedBy: adminUserId }, ip,
    });
    logger.info({ webhookId: id, adminUserId, event: 'developer.webhook_updated' }, 'Webhook updated by admin');

    return serializeWebhook(updated, 0, null);
}

async function deleteWebhook(id, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [existing] = await db.sequelize.query(
        'SELECT id, org_id, url FROM admin.dev_webhooks WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] }
    );
    if (!existing) throw new AppError('NOT_FOUND', 'Webhook not found', 404);

    // Deliveries cascade-delete via the FK ON DELETE CASCADE.
    await db.sequelize.query('DELETE FROM admin.dev_webhooks WHERE id = $1', { bind: [id] });

    await writeAudit(db, {
        userId: adminUserId, orgId: existing.org_id,
        action: 'developer.webhook_deleted', resourceType: 'webhook', resourceId: id,
        metadata: { url: existing.url, deletedBy: adminUserId }, ip,
    });
    logger.warn({ webhookId: id, adminUserId, event: 'developer.webhook_deleted' }, 'Webhook deleted by admin');

    return { id: String(id), deleted: true };
}

// Test a webhook: record a delivery attempt. admin-service does not make outbound HTTP
// calls (no egress allowlist / SSRF controls here), so this records a queued ('pending')
// delivery row for the live delivery worker to pick up and returns the recorded shape.
// It does NOT fabricate a 200/latency that never happened.
async function testWebhook(id, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [hook] = await db.sequelize.query(
        'SELECT id, org_id, events FROM admin.dev_webhooks WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] }
    );
    if (!hook) throw new AppError('NOT_FOUND', 'Webhook not found', 404);

    const events = toArray(hook.events);
    const event  = events.length > 0 ? String(events[0]) : 'ping';

    const [delivery] = await db.sequelize.query(
        `INSERT INTO admin.dev_webhook_deliveries (webhook_id, event, status, attempts, payload)
         VALUES ($1, $2, 'pending', 0, $3::jsonb)
         RETURNING id, status_code, latency_ms`,
        {
            type: db.Sequelize.QueryTypes.SELECT,
            bind: [id, event, JSON.stringify({ test: true, event, requestedBy: String(adminUserId), at: new Date().toISOString() })],
        }
    );

    await writeAudit(db, {
        userId: adminUserId, orgId: hook.org_id,
        action: 'developer.webhook_tested', resourceType: 'webhook', resourceId: id,
        metadata: { deliveryId: delivery.id, event, requestedBy: adminUserId }, ip,
    });
    eventBus.publish('developer.webhook_test_requested', { webhookId: String(id), deliveryId: String(delivery.id), event }).catch(() => {});
    logger.info({ webhookId: id, deliveryId: delivery.id, adminUserId, event: 'developer.webhook_tested' }, 'Webhook test delivery queued');

    // The console expects { statusCode, latencyMs }. Until the delivery worker runs the
    // attempt these are null — an honest "queued, no response yet" rather than a fake 200.
    return { statusCode: delivery.status_code == null ? null : Number(delivery.status_code), latencyMs: delivery.latency_ms == null ? null : Number(delivery.latency_ms) };
}

// ── Webhook deliveries ──────────────────────────────────────────────────────────
async function listDeliveries(webhookId, { page = 1, limit = 30 } = {}) {
    await ensureSchema();
    const db = getDb();
    const offset = (page - 1) * limit;

    const [hook] = await db.sequelize.query(
        'SELECT id FROM admin.dev_webhooks WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [webhookId] }
    );
    if (!hook) throw new AppError('NOT_FOUND', 'Webhook not found', 404);

    const [rows, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT id, webhook_id, event, status, status_code, attempts, latency_ms,
                    response_body, next_retry_at, payload, created_at
             FROM admin.dev_webhook_deliveries
             WHERE webhook_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [webhookId, limit, offset] }
        ),
        db.sequelize.query(
            'SELECT COUNT(*)::int AS count FROM admin.dev_webhook_deliveries WHERE webhook_id = $1',
            { type: db.Sequelize.QueryTypes.SELECT, bind: [webhookId] }
        ),
    ]);

    return paginate(rows.map(serializeDelivery), count, page, limit);
}

// Retry a failed delivery: re-queue it (status → retrying, attempts++). Mirrors
// testWebhook — admin-service does not perform outbound HTTP, so we mark it for the
// delivery worker rather than fabricating a result.
async function retryDelivery(deliveryId, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [delivery] = await db.sequelize.query(
        'SELECT id, webhook_id, status FROM admin.dev_webhook_deliveries WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [deliveryId] }
    );
    if (!delivery) throw new AppError('NOT_FOUND', 'Delivery not found', 404);

    await db.sequelize.query(
        `UPDATE admin.dev_webhook_deliveries
         SET status = 'retrying', attempts = attempts + 1, next_retry_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        { bind: [deliveryId] }
    );

    await writeAudit(db, {
        userId: adminUserId, orgId: null,
        action: 'developer.delivery_retried', resourceType: 'webhook_delivery', resourceId: deliveryId,
        metadata: { webhookId: delivery.webhook_id, retriedBy: adminUserId }, ip,
    });
    eventBus.publish('developer.delivery_retry_requested', { deliveryId: String(deliveryId), webhookId: String(delivery.webhook_id) }).catch(() => {});
    logger.info({ deliveryId, adminUserId, event: 'developer.delivery_retried' }, 'Delivery retry queued');

    return { id: String(deliveryId), status: 'retrying' };
}

// ── Sandboxes ───────────────────────────────────────────────────────────────────
async function listSandboxes({ page = 1, limit = 20 } = {}) {
    await ensureSchema();
    const db = getDb();
    const offset = (page - 1) * limit;

    const [rows, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT id, name, owner, org_id, status, base_url, expires_at, created_at
             FROM admin.dev_sandboxes
             ORDER BY created_at DESC
             LIMIT $1 OFFSET $2`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [limit, offset] }
        ),
        db.sequelize.query(
            'SELECT COUNT(*)::int AS count FROM admin.dev_sandboxes',
            { type: db.Sequelize.QueryTypes.SELECT }
        ),
    ]);

    return paginate(rows.map(serializeSandbox), count, page, limit);
}

async function createSandbox(input, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 255) {
        throw new AppError('VALIDATION_ERROR', 'Sandbox name is required (max 255 chars)', 400);
    }
    const orgId = (input.orgId != null && String(input.orgId).trim() !== '') ? String(input.orgId).trim() : null;

    const [created] = await db.sequelize.query(
        `INSERT INTO admin.dev_sandboxes (name, owner, org_id, status)
         VALUES ($1, $2, $3, 'creating')
         RETURNING id, name, owner, org_id, status, base_url, expires_at, created_at`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [name, adminUserId, orgId] }
    );

    await writeAudit(db, {
        userId: adminUserId, orgId,
        action: 'developer.sandbox_created', resourceType: 'sandbox', resourceId: created.id,
        metadata: { name, createdBy: adminUserId }, ip,
    });
    logger.info({ sandboxId: created.id, adminUserId, event: 'developer.sandbox_created' }, 'Sandbox created by admin');

    return serializeSandbox(created);
}

async function resetSandbox(id, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [sandbox] = await db.sequelize.query(
        'SELECT id, org_id, name FROM admin.dev_sandboxes WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] }
    );
    if (!sandbox) throw new AppError('NOT_FOUND', 'Sandbox not found', 404);

    await db.sequelize.query(
        "UPDATE admin.dev_sandboxes SET status = 'running', updated_at = NOW() WHERE id = $1",
        { bind: [id] }
    );

    await writeAudit(db, {
        userId: adminUserId, orgId: sandbox.org_id,
        action: 'developer.sandbox_reset', resourceType: 'sandbox', resourceId: id,
        metadata: { name: sandbox.name, resetBy: adminUserId }, ip,
    });
    eventBus.publish('developer.sandbox_reset', { sandboxId: String(id), resetBy: String(adminUserId) }).catch(() => {});
    logger.info({ sandboxId: id, adminUserId, event: 'developer.sandbox_reset' }, 'Sandbox reset by admin');

    return { id: String(id), reset: true };
}

async function deleteSandbox(id, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [sandbox] = await db.sequelize.query(
        'SELECT id, org_id, name FROM admin.dev_sandboxes WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] }
    );
    if (!sandbox) throw new AppError('NOT_FOUND', 'Sandbox not found', 404);

    await db.sequelize.query('DELETE FROM admin.dev_sandboxes WHERE id = $1', { bind: [id] });

    await writeAudit(db, {
        userId: adminUserId, orgId: sandbox.org_id,
        action: 'developer.sandbox_deleted', resourceType: 'sandbox', resourceId: id,
        metadata: { name: sandbox.name, deletedBy: adminUserId }, ip,
    });
    logger.warn({ sandboxId: id, adminUserId, event: 'developer.sandbox_deleted' }, 'Sandbox deleted by admin');

    return { id: String(id), deleted: true };
}

// ── Changelog (static REAL catalog — not stored, not fabricated metrics) ─────────
// These are real platform release notes. They are versioned in code and returned as-is
// (no per-call numbers invented). Paginated to honor the console's contract.
const CHANGELOG = [
    {
        id: 'cl-2026-06-platform-foundation', version: '1.0.0',
        title: 'Platform foundation GA', type: 'feature',
        body: 'Centralized RS256 auth (@baalvion/auth-node), the unified @baalvion/sdk integration layer, RBAC service, audit service, and the admin console reach general availability.',
        publishedAt: '2026-06-01T00:00:00.000Z', createdAt: '2026-06-01T00:00:00.000Z',
    },
    {
        id: 'cl-2026-05-commerce-vertical', version: '0.9.0',
        title: 'Commerce vertical & multi-country pricing', type: 'feature',
        body: 'Per-country pricing (base USD × FX) and tax via commerce-service markets, order-service market/tax columns, and storefront FX-aware cart/checkout.',
        publishedAt: '2026-05-31T00:00:00.000Z', createdAt: '2026-05-31T00:00:00.000Z',
    },
    {
        id: 'cl-2026-05-events-bus', version: '0.8.0',
        title: 'Redis Streams event transport', type: 'feature',
        body: 'sdk.events now delivers real events to the baalvion:events stream with durable per-pattern consumer groups, PEL reclaim, and traceId/tenantId propagation.',
        publishedAt: '2026-05-30T00:00:00.000Z', createdAt: '2026-05-30T00:00:00.000Z',
    },
    {
        id: 'cl-2026-05-auth-hs256-decommission', version: '0.7.0',
        title: 'HS256 issuer decommission', type: 'breaking',
        body: 'Backend services no longer accept HS256 tokens. All verification is RS256 via the One True Verifier; the auth-gateway BFF is the sole token boundary.',
        publishedAt: '2026-05-28T00:00:00.000Z', createdAt: '2026-05-28T00:00:00.000Z',
    },
];

async function listChangelog({ page = 1, limit = 30 } = {}) {
    const total  = CHANGELOG.length;
    const offset = (page - 1) * limit;
    const items  = CHANGELOG.slice(offset, offset + limit);
    return paginate(items, total, page, limit);
}

// ── SDK registry (static REAL catalog) ──────────────────────────────────────────
const SDKS = [
    {
        id: 'sdk-typescript', language: 'typescript', version: '1.0.0',
        downloadUrl: 'https://www.npmjs.com/package/@baalvion/sdk',
        changelog: 'Initial GA: config resolver, internal auth, http client, trace/events/logger facades.',
        publishedAt: '2026-06-01T00:00:00.000Z',
    },
    {
        id: 'sdk-python', language: 'python', version: '0.9.0',
        downloadUrl: 'https://pypi.org/project/baalvion-sdk/',
        changelog: 'Beta Python client mirroring the TypeScript SDK surface.',
        publishedAt: '2026-05-25T00:00:00.000Z',
    },
    {
        id: 'sdk-go', language: 'go', version: '0.8.0',
        downloadUrl: 'https://pkg.go.dev/github.com/baalvion/sdk-go',
        changelog: 'Beta Go client for service-to-service integration.',
        publishedAt: '2026-05-20T00:00:00.000Z',
    },
    {
        id: 'sdk-java', language: 'java', version: '0.8.0',
        downloadUrl: 'https://central.sonatype.com/artifact/com.baalvion/sdk',
        changelog: 'Beta Java/Spring client used by the financial-services suite.',
        publishedAt: '2026-05-20T00:00:00.000Z',
    },
];

async function listSdks() {
    return SDKS;
}

// ── Audit helper (writes to the shared auth.audit_logs store) ────────────────────
async function writeAudit(db, { userId, orgId = null, action, resourceType, resourceId, metadata = {}, ip = '0.0.0.0' }) {
    try {
        await db.sequelize.query(
            `INSERT INTO auth.audit_logs (user_id, org_id, action, resource_type, resource_id, metadata, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            { bind: [userId, orgId, action, resourceType, resourceId == null ? null : String(resourceId), JSON.stringify(metadata), ip] }
        );
    } catch (err) {
        // Audit is best-effort; never let an audit failure mask the primary mutation.
        logger.warn({ err: err.message, action, event: 'developer.audit_failed' }, 'Failed to write developer audit row');
    }
}

module.exports = {
    ensureSchema,
    getApiStats,
    listWebhooks, getWebhook, createWebhook, updateWebhook, deleteWebhook, testWebhook,
    listDeliveries, retryDelivery,
    listSandboxes, createSandbox, resetSandbox, deleteSandbox,
    listChangelog, listSdks,
};
