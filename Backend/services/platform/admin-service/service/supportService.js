'use strict';
// admin-service :: support (ticketing) module — service layer.
//
// Mirrors service/adminService.js exactly: raw, parameterized (bind-only) Sequelize
// queries via db.sequelize.query, AppError for typed failures, logger for structured
// logs, and mutation audit rows written to auth.audit_logs.
//
// Owns three tables in the dedicated `admin` schema (see migrations/003_support.sql):
//   admin.support_tickets, admin.support_messages, admin.support_macros
// ensureSchema() provisions them idempotently and is memoized so the DDL runs once
// per process; every public function awaits it first.

const { AppError } = require('../utils/errors');
const logger       = require('../utils/logger');
const eventBus     = require('../utils/eventBus');

let _db;
function getDb() {
    if (!_db) _db = require('../models');
    return _db;
}

// ── Self-provisioning schema (memoized — runs once per process) ────────────────
const SCHEMA_DDL = `
CREATE SCHEMA IF NOT EXISTS admin;

CREATE TABLE IF NOT EXISTS admin.support_tickets (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number     TEXT         NOT NULL UNIQUE,
    subject           TEXT         NOT NULL,
    description       TEXT         NOT NULL DEFAULT '',
    status            TEXT         NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'pending', 'resolved', 'closed', 'escalated')),
    priority          TEXT         NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category          TEXT         NOT NULL DEFAULT 'other'
        CHECK (category IN ('billing', 'technical', 'account', 'security', 'feature_request', 'abuse', 'other')),
    requester_user_id UUID,
    requester_email   TEXT         NOT NULL,
    requester_name    TEXT         NOT NULL DEFAULT '',
    org_id            UUID,
    org_name          TEXT,
    assignee_id       UUID,
    assignee_name     TEXT,
    tags              JSONB        NOT NULL DEFAULT '[]'::jsonb,
    channel           TEXT         NOT NULL DEFAULT 'web',
    sla_deadline      TIMESTAMPTZ,
    sla_breached      BOOLEAN      NOT NULL DEFAULT FALSE,
    first_response_at TIMESTAMPTZ,
    resolved_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status     ON admin.support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority   ON admin.support_tickets (priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assignee   ON admin.support_tickets (assignee_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON admin.support_tickets (created_at DESC);

CREATE TABLE IF NOT EXISTS admin.support_messages (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID         NOT NULL REFERENCES admin.support_tickets(id) ON DELETE CASCADE,
    author_type TEXT         NOT NULL DEFAULT 'agent'
        CHECK (author_type IN ('agent', 'customer', 'system')),
    author_id   UUID,
    author_name TEXT         NOT NULL DEFAULT '',
    body        TEXT         NOT NULL,
    internal    BOOLEAN      NOT NULL DEFAULT FALSE,
    attachments JSONB        NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket
    ON admin.support_messages (ticket_id, created_at ASC);

CREATE TABLE IF NOT EXISTS admin.support_macros (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT         NOT NULL,
    body        TEXT         NOT NULL,
    category    TEXT         NOT NULL DEFAULT 'general',
    usage_count INTEGER      NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_macros_created_at ON admin.support_macros (created_at DESC);
`;

let _schemaPromise = null;
function ensureSchema() {
    if (!_schemaPromise) {
        const db = getDb();
        _schemaPromise = db.sequelize.query(SCHEMA_DDL).catch((err) => {
            // Reset so a transient failure (e.g. DB not yet up) can be retried on the
            // next call instead of being permanently memoized as failed.
            _schemaPromise = null;
            logger.error({ err: err.message, event: 'support.ensure_schema_failed' }, 'support ensureSchema failed');
            throw err;
        });
    }
    return _schemaPromise;
}

// ── Constants / validation ────────────────────────────────────────────────────
const TICKET_STATUSES   = ['open', 'pending', 'resolved', 'closed', 'escalated'];
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TICKET_CATEGORIES = ['billing', 'technical', 'account', 'security', 'feature_request', 'abuse', 'other'];
const MAX_BODY_LEN      = 20000;
const MAX_SUBJECT_LEN   = 500;

// ── Serializers (DB row → frontend SupportTicket / TicketMessage / Macro) ──────
function serializeTicket(r) {
    return {
        id:              String(r.id),
        ticketNumber:    r.ticket_number,
        subject:         r.subject,
        description:     r.description || '',
        status:          r.status,
        priority:        r.priority,
        category:        r.category,
        userId:          r.requester_user_id ? String(r.requester_user_id) : null,
        userEmail:       r.requester_email,
        userName:        r.requester_name || '',
        orgId:           r.org_id ? String(r.org_id) : null,
        orgName:         r.org_name || null,
        assigneeId:      r.assignee_id ? String(r.assignee_id) : null,
        assigneeName:    r.assignee_name || null,
        tags:            Array.isArray(r.tags) ? r.tags : [],
        slaDeadline:     r.sla_deadline || null,
        slaBreached:     !!r.sla_breached,
        messageCount:    r.message_count != null ? parseInt(r.message_count, 10) : 0,
        firstResponseAt: r.first_response_at || null,
        resolvedAt:      r.resolved_at || null,
        createdAt:       r.created_at,
        updatedAt:       r.updated_at,
    };
}

function serializeMessage(r) {
    // author_type is the storage form; the console renders 'user'|'agent'|'system'.
    const roleMap = { customer: 'user', agent: 'agent', system: 'system' };
    return {
        id:          String(r.id),
        ticketId:    String(r.ticket_id),
        authorId:    r.author_id ? String(r.author_id) : '',
        authorName:  r.author_name || '',
        authorRole:  roleMap[r.author_type] || 'agent',
        body:        r.body,
        isInternal:  !!r.internal,
        attachments: Array.isArray(r.attachments) ? r.attachments : [],
        createdAt:   r.created_at,
    };
}

function serializeMacro(r) {
    return {
        id:         String(r.id),
        name:       r.name,
        body:       r.body,
        category:   r.category,
        usageCount: parseInt(r.usage_count, 10) || 0,
    };
}

// ── Audit helper (mirrors adminService's auth.audit_logs writes) ───────────────
async function writeAudit(action, { userId, resourceId, metadata, ipAddress }) {
    const db = getDb();
    try {
        await db.sequelize.query(
            `INSERT INTO auth.audit_logs (user_id, action, resource_type, resource_id, metadata, ip_address)
             VALUES ($1, $2, 'support_ticket', $3, $4, $5)`,
            { bind: [userId || null, action, resourceId != null ? String(resourceId) : null, JSON.stringify(metadata || {}), ipAddress || '0.0.0.0'] }
        );
    } catch (err) {
        // Audit must never break the primary mutation; log and continue.
        logger.warn({ err: err.message, action, event: 'support.audit_write_failed' }, 'support audit write failed');
    }
}

// ── Stats ──────────────────────────────────────────────────────────────────────
async function getStats() {
    await ensureSchema();
    const db = getDb();

    const [row] = await db.sequelize.query(`
        SELECT
            COUNT(*) FILTER (WHERE status = 'open')                                          AS open_tickets,
            COUNT(*) FILTER (WHERE status = 'pending')                                       AS pending_tickets,
            COUNT(*) FILTER (WHERE resolved_at IS NOT NULL AND resolved_at >= date_trunc('day', NOW())) AS resolved_today,
            COUNT(*) FILTER (WHERE sla_breached = TRUE AND status NOT IN ('resolved', 'closed')) AS sla_breached,
            COALESCE(AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) * 1000)
                     FILTER (WHERE first_response_at IS NOT NULL), 0)                        AS avg_first_response_ms,
            COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) * 1000)
                     FILTER (WHERE resolved_at IS NOT NULL), 0)                              AS avg_resolution_ms
        FROM admin.support_tickets
    `, { type: db.Sequelize.QueryTypes.SELECT });

    const s = row || {};
    return {
        openTickets:        parseInt(s.open_tickets, 10) || 0,
        pendingTickets:     parseInt(s.pending_tickets, 10) || 0,
        resolvedToday:      parseInt(s.resolved_today, 10) || 0,
        avgFirstResponseMs: Math.round(parseFloat(s.avg_first_response_ms) || 0),
        avgResolutionMs:    Math.round(parseFloat(s.avg_resolution_ms) || 0),
        slaBreached:        parseInt(s.sla_breached, 10) || 0,
        // CSAT is not collected by this module yet — honest null (UI renders "—").
        csat:               null,
    };
}

// ── List (filters + pagination) ────────────────────────────────────────────────
async function listTickets({ page = 1, limit = 50, status, priority, category, assigneeId, search }) {
    await ensureSchema();
    const db     = getDb();
    const offset = (page - 1) * limit;
    const where  = ['1=1'];
    const bind   = [];

    // 'all' is the console's "no filter" sentinel — ignore it.
    if (status && status !== 'all') {
        if (!TICKET_STATUSES.includes(status)) throw new AppError('VALIDATION_ERROR', `Invalid status filter; allowed: ${TICKET_STATUSES.join(', ')}`, 400);
        where.push(`t.status = $${bind.length + 1}`); bind.push(status);
    }
    if (priority && priority !== 'all') {
        if (!TICKET_PRIORITIES.includes(priority)) throw new AppError('VALIDATION_ERROR', `Invalid priority filter; allowed: ${TICKET_PRIORITIES.join(', ')}`, 400);
        where.push(`t.priority = $${bind.length + 1}`); bind.push(priority);
    }
    if (category && category !== 'all') {
        if (!TICKET_CATEGORIES.includes(category)) throw new AppError('VALIDATION_ERROR', `Invalid category filter; allowed: ${TICKET_CATEGORIES.join(', ')}`, 400);
        where.push(`t.category = $${bind.length + 1}`); bind.push(category);
    }
    if (assigneeId) { where.push(`t.assignee_id = $${bind.length + 1}`); bind.push(assigneeId); }
    if (search) {
        where.push(`(t.subject ILIKE $${bind.length + 1} OR t.requester_email ILIKE $${bind.length + 2} OR t.requester_name ILIKE $${bind.length + 3} OR t.ticket_number ILIKE $${bind.length + 4})`);
        const like = `%${search}%`;
        bind.push(like, like, like, like);
    }

    const whereSql = where.join(' AND ');

    const [rows, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT t.*,
                    (SELECT COUNT(*)::int FROM admin.support_messages m WHERE m.ticket_id = t.id) AS message_count
             FROM admin.support_tickets t
             WHERE ${whereSql}
             ORDER BY t.updated_at DESC
             LIMIT $${bind.length + 1} OFFSET $${bind.length + 2}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [...bind, limit, offset] }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS count FROM admin.support_tickets t WHERE ${whereSql}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind }
        ),
    ]);

    return { items: rows.map(serializeTicket), total: count, page, limit };
}

// ── Get detail (ticket + messages) ──────────────────────────────────────────────
async function getTicketRow(ticketId) {
    const db = getDb();
    const [row] = await db.sequelize.query(
        `SELECT t.*,
                (SELECT COUNT(*)::int FROM admin.support_messages m WHERE m.ticket_id = t.id) AS message_count
         FROM admin.support_tickets t
         WHERE t.id = $1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [ticketId] }
    );
    if (!row) throw new AppError('NOT_FOUND', 'Ticket not found', 404);
    return row;
}

async function getTicket(ticketId) {
    await ensureSchema();
    const row = await getTicketRow(ticketId);
    return serializeTicket(row);
}

async function listMessages(ticketId) {
    await ensureSchema();
    const db = getDb();
    // Confirm the ticket exists for an honest 404 (vs an empty list for a bad id).
    await getTicketRow(ticketId);
    const rows = await db.sequelize.query(
        `SELECT id, ticket_id, author_type, author_id, author_name, body, internal, attachments, created_at
         FROM admin.support_messages
         WHERE ticket_id = $1
         ORDER BY created_at ASC`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [ticketId] }
    );
    return rows.map(serializeMessage);
}

// ── Reply / internal note (create message) ──────────────────────────────────────
// An agent reply or internal note. Sets first_response_at on the first NON-internal
// agent reply, and bumps the ticket's updated_at so it surfaces in the list.
async function addMessage(ticketId, { body, isInternal }, adminUserId, adminName, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const trimmed = typeof body === 'string' ? body.trim() : '';
    if (!trimmed) throw new AppError('VALIDATION_ERROR', 'Message body is required', 400);
    if (trimmed.length > MAX_BODY_LEN) throw new AppError('VALIDATION_ERROR', `Message body must be at most ${MAX_BODY_LEN} chars`, 400);

    const ticket  = await getTicketRow(ticketId);
    const internal = isInternal === true;

    const [message] = await db.sequelize.query(
        `INSERT INTO admin.support_messages (ticket_id, author_type, author_id, author_name, body, internal)
         VALUES ($1, 'agent', $2, $3, $4, $5)
         RETURNING id, ticket_id, author_type, author_id, author_name, body, internal, attachments, created_at`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [ticketId, adminUserId || null, adminName || 'Support', trimmed, internal] }
    );

    // A public agent reply records first response time (once) and moves an open
    // ticket to 'pending' (awaiting customer). Internal notes change neither.
    const setFirstResponse = !internal && !ticket.first_response_at;
    const moveToPending    = !internal && ticket.status === 'open';

    await db.sequelize.query(
        `UPDATE admin.support_tickets
         SET updated_at = NOW(),
             first_response_at = CASE WHEN $2 THEN NOW() ELSE first_response_at END,
             status = CASE WHEN $3 THEN 'pending' ELSE status END
         WHERE id = $1`,
        { bind: [ticketId, setFirstResponse, moveToPending] }
    );

    await writeAudit(internal ? 'support.note_added' : 'support.reply_sent', {
        userId: adminUserId, resourceId: ticketId,
        metadata: { ticketNumber: ticket.ticket_number, internal, messageId: message.id },
        ipAddress,
    });

    eventBus.publish(internal ? 'support.note_added' : 'support.reply_sent', {
        ticketId: String(ticketId), ticketNumber: ticket.ticket_number, internal, by: String(adminUserId || ''),
    }).catch(() => {});

    logger.info({ ticketId, adminUserId, internal, event: 'support.message_created' }, 'Support message created');
    return serializeMessage(message);
}

// ── Update status / priority / assignee / tags ──────────────────────────────────
async function updateTicket(ticketId, patch, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const ticket = await getTicketRow(ticketId);

    const sets    = [];
    const bind    = [];
    const changed = {};

    if (patch.status !== undefined) {
        const status = String(patch.status).trim();
        if (!TICKET_STATUSES.includes(status)) throw new AppError('VALIDATION_ERROR', `Invalid status; allowed: ${TICKET_STATUSES.join(', ')}`, 400);
        sets.push(`status = $${bind.length + 1}`); bind.push(status); changed.status = status;
        // Stamp/clear resolved_at when crossing the resolved/closed boundary.
        if ((status === 'resolved' || status === 'closed') && !ticket.resolved_at) {
            sets.push('resolved_at = NOW()');
        } else if (status !== 'resolved' && status !== 'closed' && ticket.resolved_at) {
            sets.push('resolved_at = NULL');
        }
    }
    if (patch.priority !== undefined) {
        const priority = String(patch.priority).trim();
        if (!TICKET_PRIORITIES.includes(priority)) throw new AppError('VALIDATION_ERROR', `Invalid priority; allowed: ${TICKET_PRIORITIES.join(', ')}`, 400);
        sets.push(`priority = $${bind.length + 1}`); bind.push(priority); changed.priority = priority;
    }
    if (patch.assigneeId !== undefined) {
        // null/'' clears the assignment.
        const assigneeId = patch.assigneeId == null || String(patch.assigneeId).trim() === '' ? null : String(patch.assigneeId).trim();
        sets.push(`assignee_id = $${bind.length + 1}`); bind.push(assigneeId); changed.assigneeId = assigneeId;
        if (patch.assigneeName !== undefined || assigneeId === null) {
            const assigneeName = assigneeId === null ? null : (patch.assigneeName != null ? String(patch.assigneeName).trim() : null);
            sets.push(`assignee_name = $${bind.length + 1}`); bind.push(assigneeName); changed.assigneeName = assigneeName;
        }
    }
    if (patch.tags !== undefined) {
        if (!Array.isArray(patch.tags)) throw new AppError('VALIDATION_ERROR', 'tags must be an array of strings', 400);
        const tags = patch.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 50);
        sets.push(`tags = $${bind.length + 1}::jsonb`); bind.push(JSON.stringify(tags)); changed.tags = tags;
    }

    if (sets.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'No updatable fields provided (status, priority, assigneeId, tags)', 400);
    }

    sets.push('updated_at = NOW()');
    bind.push(ticketId);

    const [updated] = await db.sequelize.query(
        `UPDATE admin.support_tickets SET ${sets.join(', ')}
         WHERE id = $${bind.length}
         RETURNING *,
                   (SELECT COUNT(*)::int FROM admin.support_messages m WHERE m.ticket_id = admin.support_tickets.id) AS message_count`,
        { type: db.Sequelize.QueryTypes.SELECT, bind }
    );

    await writeAudit('support.ticket_updated', {
        userId: adminUserId, resourceId: ticketId,
        metadata: { ticketNumber: ticket.ticket_number, changed }, ipAddress,
    });

    logger.info({ ticketId, adminUserId, changed, event: 'support.ticket_updated' }, 'Support ticket updated');
    return serializeTicket(updated);
}

// Assign a ticket to an agent. Thin wrapper over updateTicket for the dedicated route.
async function assignTicket(ticketId, { assigneeId, assigneeName }, adminUserId, ipAddress) {
    if (assigneeId == null || String(assigneeId).trim() === '') {
        throw new AppError('VALIDATION_ERROR', 'assigneeId is required', 400);
    }
    return updateTicket(ticketId, { assigneeId, assigneeName }, adminUserId, ipAddress);
}

// Escalate: bump status to 'escalated' and append a system note capturing the reason.
async function escalateTicket(ticketId, reason, adminUserId, adminName, ipAddress) {
    await ensureSchema();
    const db = getDb();
    const ticket = await getTicketRow(ticketId);

    const reasonText = typeof reason === 'string' ? reason.trim() : '';

    await db.sequelize.query(
        `UPDATE admin.support_tickets SET status = 'escalated', priority = CASE WHEN priority IN ('low','medium') THEN 'high' ELSE priority END, updated_at = NOW() WHERE id = $1`,
        { bind: [ticketId] }
    );
    await db.sequelize.query(
        `INSERT INTO admin.support_messages (ticket_id, author_type, author_id, author_name, body, internal)
         VALUES ($1, 'system', $2, $3, $4, TRUE)`,
        { bind: [ticketId, adminUserId || null, adminName || 'System', `Ticket escalated${reasonText ? `: ${reasonText}` : ''}`] }
    );

    await writeAudit('support.ticket_escalated', {
        userId: adminUserId, resourceId: ticketId,
        metadata: { ticketNumber: ticket.ticket_number, reason: reasonText || null }, ipAddress,
    });

    logger.warn({ ticketId, adminUserId, event: 'support.ticket_escalated' }, 'Support ticket escalated');
    return getTicket(ticketId);
}

// Close: resolution string is recorded as a system note; status → closed.
async function closeTicket(ticketId, resolution, adminUserId, adminName, ipAddress) {
    await ensureSchema();
    const db = getDb();
    const ticket = await getTicketRow(ticketId);

    const resolutionText = typeof resolution === 'string' ? resolution.trim() : '';

    await db.sequelize.query(
        `UPDATE admin.support_tickets
         SET status = 'closed', resolved_at = COALESCE(resolved_at, NOW()), updated_at = NOW()
         WHERE id = $1`,
        { bind: [ticketId] }
    );
    if (resolutionText) {
        await db.sequelize.query(
            `INSERT INTO admin.support_messages (ticket_id, author_type, author_id, author_name, body, internal)
             VALUES ($1, 'system', $2, $3, $4, TRUE)`,
            { bind: [ticketId, adminUserId || null, adminName || 'System', `Ticket closed: ${resolutionText}`] }
        );
    }

    await writeAudit('support.ticket_closed', {
        userId: adminUserId, resourceId: ticketId,
        metadata: { ticketNumber: ticket.ticket_number, resolution: resolutionText || null }, ipAddress,
    });

    logger.info({ ticketId, adminUserId, event: 'support.ticket_closed' }, 'Support ticket closed');
    return getTicket(ticketId);
}

// ── Customer timeline ───────────────────────────────────────────────────────────
// Aggregates a customer's support history. Auth/payment/security events come from the
// shared auth.audit_logs (read-only); their tickets come from this module. Payments
// are left empty — admin-service does not own the billing store.
async function getCustomerTimeline(userId) {
    await ensureSchema();
    const db = getDb();

    const [user] = await db.sequelize.query(
        `SELECT u.id, u.email, u.full_name, u.created_at,
                (SELECT MAX(s.last_seen_at) FROM auth.sessions s WHERE s.user_id = u.id) AS last_active_at,
                (SELECT o.plan FROM auth.organizations o
                  JOIN auth.team_members m ON m.org_id = o.id AND m.user_id = u.id AND m.status = 'active'
                  ORDER BY m.joined_at ASC LIMIT 1) AS plan
         FROM auth.users u WHERE u.id = $1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
    );
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    const TIMELINE_ACTION_TYPE = {
        'user.login':                 'auth',
        'user.login_failed':          'security',
        'user.logout':                'auth',
        'session.revoked':            'security',
        'user.suspended':             'account',
        'user.unsuspended':           'account',
        'user.updated':               'account',
        'admin.impersonation_started':'security',
    };

    const [auditRows, ticketRows] = await Promise.all([
        db.sequelize.query(
            `SELECT id, action, metadata, created_at
             FROM auth.audit_logs
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 50`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
        ),
        db.sequelize.query(
            `SELECT t.*,
                    (SELECT COUNT(*)::int FROM admin.support_messages m WHERE m.ticket_id = t.id) AS message_count
             FROM admin.support_tickets t
             WHERE t.requester_user_id = $1
             ORDER BY t.created_at DESC
             LIMIT 50`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
        ),
    ]);

    const events = auditRows.map((r) => ({
        id:        String(r.id),
        type:      TIMELINE_ACTION_TYPE[r.action] || 'account',
        action:    r.action,
        meta:      r.metadata || {},
        createdAt: r.created_at,
    }));

    return {
        userId:       String(user.id),
        email:        user.email,
        name:         user.full_name || '',
        plan:         user.plan || 'free',
        signedUpAt:   user.created_at,
        lastActiveAt: user.last_active_at || user.created_at,
        events,
        tickets:      ticketRows.map(serializeTicket),
        payments:     [],
    };
}

// ── Macros ───────────────────────────────────────────────────────────────────
async function listMacros() {
    await ensureSchema();
    const db = getDb();
    const rows = await db.sequelize.query(
        `SELECT id, name, body, category, usage_count FROM admin.support_macros ORDER BY created_at DESC`,
        { type: db.Sequelize.QueryTypes.SELECT }
    );
    return rows.map(serializeMacro);
}

async function createMacro({ name, body, category }, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedBody = typeof body === 'string' ? body.trim() : '';
    if (!trimmedName || trimmedName.length > 255) throw new AppError('VALIDATION_ERROR', 'Macro name is required (max 255 chars)', 400);
    if (!trimmedBody) throw new AppError('VALIDATION_ERROR', 'Macro body is required', 400);
    if (trimmedBody.length > MAX_BODY_LEN) throw new AppError('VALIDATION_ERROR', `Macro body must be at most ${MAX_BODY_LEN} chars`, 400);
    const finalCategory = (category != null && String(category).trim() !== '') ? String(category).trim().slice(0, 100) : 'general';

    const [macro] = await db.sequelize.query(
        `INSERT INTO admin.support_macros (name, body, category)
         VALUES ($1, $2, $3)
         RETURNING id, name, body, category, usage_count`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [trimmedName, trimmedBody, finalCategory] }
    );

    await writeAudit('support.macro_created', { userId: adminUserId, resourceId: macro.id, metadata: { name: trimmedName }, ipAddress });
    logger.info({ macroId: macro.id, adminUserId, event: 'support.macro_created' }, 'Support macro created');
    return serializeMacro(macro);
}

async function updateMacro(macroId, patch, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const [existing] = await db.sequelize.query(
        'SELECT id FROM admin.support_macros WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [macroId] }
    );
    if (!existing) throw new AppError('NOT_FOUND', 'Macro not found', 404);

    const sets = [];
    const bind = [];

    if (patch.name !== undefined) {
        const trimmedName = String(patch.name).trim();
        if (!trimmedName || trimmedName.length > 255) throw new AppError('VALIDATION_ERROR', 'Macro name must be 1-255 chars', 400);
        sets.push(`name = $${bind.length + 1}`); bind.push(trimmedName);
    }
    if (patch.body !== undefined) {
        const trimmedBody = String(patch.body).trim();
        if (!trimmedBody) throw new AppError('VALIDATION_ERROR', 'Macro body cannot be empty', 400);
        if (trimmedBody.length > MAX_BODY_LEN) throw new AppError('VALIDATION_ERROR', `Macro body must be at most ${MAX_BODY_LEN} chars`, 400);
        sets.push(`body = $${bind.length + 1}`); bind.push(trimmedBody);
    }
    if (patch.category !== undefined) {
        const finalCategory = (patch.category != null && String(patch.category).trim() !== '') ? String(patch.category).trim().slice(0, 100) : 'general';
        sets.push(`category = $${bind.length + 1}`); bind.push(finalCategory);
    }

    if (sets.length === 0) throw new AppError('VALIDATION_ERROR', 'No updatable fields provided (name, body, category)', 400);

    sets.push('updated_at = NOW()');
    bind.push(macroId);

    const [updated] = await db.sequelize.query(
        `UPDATE admin.support_macros SET ${sets.join(', ')}
         WHERE id = $${bind.length}
         RETURNING id, name, body, category, usage_count`,
        { type: db.Sequelize.QueryTypes.SELECT, bind }
    );

    await writeAudit('support.macro_updated', { userId: adminUserId, resourceId: macroId, metadata: {}, ipAddress });
    logger.info({ macroId, adminUserId, event: 'support.macro_updated' }, 'Support macro updated');
    return serializeMacro(updated);
}

async function deleteMacro(macroId, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const deleted = await db.sequelize.query(
        'DELETE FROM admin.support_macros WHERE id = $1 RETURNING id',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [macroId] }
    );
    if (!Array.isArray(deleted) || deleted.length === 0) throw new AppError('NOT_FOUND', 'Macro not found', 404);

    await writeAudit('support.macro_deleted', { userId: adminUserId, resourceId: macroId, metadata: {}, ipAddress });
    logger.info({ macroId, adminUserId, event: 'support.macro_deleted' }, 'Support macro deleted');
    return { id: String(macroId), deleted: true };
}

module.exports = {
    ensureSchema,
    getStats,
    listTickets, getTicket, listMessages,
    addMessage, updateTicket, assignTicket, escalateTicket, closeTicket,
    getCustomerTimeline,
    listMacros, createMacro, updateMacro, deleteMacro,
};
