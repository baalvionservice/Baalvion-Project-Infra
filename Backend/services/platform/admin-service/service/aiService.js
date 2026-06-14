'use strict';
// AI Operations module service. Mirrors adminService.js / featureFlagsService.js
// conventions exactly:
//   - raw Sequelize via db.sequelize.query with bind params ONLY (never interpolate)
//   - AppError for all operational failures
//   - mutations write an audit row to auth.audit_logs (the shared audit store)
//
// Data lives in a dedicated `admin` schema, self-provisioned via ensureSchema()
// (no migration runner exists in this service). ensureSchema() is memoized so the
// DDL runs at most once per process; every public function awaits it first.
//
// The model catalog is a STATIC code constant (the set of providers/models the
// platform can run) — only per-model enable/cost OVERRIDES are persisted. Agents,
// prompts and inference jobs are fully DB-backed. No fake/mock rows are seeded:
// empty tables yield honest empty responses.

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

            CREATE TABLE IF NOT EXISTS admin.ai_agents (
                id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                name          TEXT         NOT NULL,
                description   TEXT,
                type          TEXT         NOT NULL DEFAULT 'assistant'
                    CHECK (type IN ('assistant', 'workflow', 'rag', 'tool_use')),
                model         TEXT,
                system_prompt TEXT,
                tools         JSONB        NOT NULL DEFAULT '[]'::jsonb,
                status        TEXT         NOT NULL DEFAULT 'enabled'
                    CHECK (status IN ('enabled', 'disabled')),
                config        JSONB        NOT NULL DEFAULT '{}'::jsonb,
                created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_ai_agents_created_at ON admin.ai_agents (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_ai_agents_status     ON admin.ai_agents (status);

            CREATE TABLE IF NOT EXISTS admin.ai_prompts (
                id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                name        TEXT         NOT NULL,
                slug        TEXT,
                description TEXT,
                template    TEXT         NOT NULL DEFAULT '',
                model       TEXT,
                version     INTEGER      NOT NULL DEFAULT 1 CHECK (version >= 1),
                status      TEXT         NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'archived')),
                tags        TEXT[]       NOT NULL DEFAULT '{}',
                config      JSONB        NOT NULL DEFAULT '{}'::jsonb,
                created_by  TEXT,
                created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_ai_prompts_created_at ON admin.ai_prompts (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_ai_prompts_status     ON admin.ai_prompts (status);

            CREATE TABLE IF NOT EXISTS admin.ai_inference_jobs (
                id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                agent_id     UUID         REFERENCES admin.ai_agents (id) ON DELETE SET NULL,
                model        TEXT,
                provider     TEXT,
                status       TEXT         NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
                priority     INTEGER      NOT NULL DEFAULT 0,
                tokens_in    INTEGER,
                tokens_out   INTEGER,
                cost_usd     NUMERIC(12, 6) NOT NULL DEFAULT 0,
                latency_ms   INTEGER,
                error        TEXT,
                created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                completed_at TIMESTAMPTZ
            );
            CREATE INDEX IF NOT EXISTS idx_ai_inference_jobs_created_at ON admin.ai_inference_jobs (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_ai_inference_jobs_status     ON admin.ai_inference_jobs (status);
            CREATE INDEX IF NOT EXISTS idx_ai_inference_jobs_agent_id   ON admin.ai_inference_jobs (agent_id);

            CREATE TABLE IF NOT EXISTS admin.ai_model_overrides (
                model_id            TEXT         PRIMARY KEY,
                enabled             BOOLEAN,
                cost_per_1k_input   NUMERIC(12, 6),
                cost_per_1k_output  NUMERIC(12, 6),
                created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
        `)
        .catch((err) => {
            // Reset so a transient failure (e.g. DB not ready) can be retried on the
            // next call rather than caching a rejected promise forever.
            _schemaReady = null;
            throw err;
        });
    return _schemaReady;
}

// ── Static model catalog (code, not data) ─────────────────────────────────────
// The set of provider models the platform is configured to run. Per-model enable
// state and cost can be overridden at runtime (admin.ai_model_overrides); the
// catalog supplies defaults + immutable metadata (provider, context window, etc.).
// Usage metrics (callsToday / tokensToday / errorRate / latency) are aggregated
// live from admin.ai_inference_jobs by model id.
const MODEL_CATALOG = [
    { id: 'claude-opus-4',      name: 'Claude Opus 4',        provider: 'anthropic', modelId: 'claude-opus-4-20250514',     type: 'chat',      contextWindow: 200000, maxOutputTokens: 32000, costPer1kInput: 0.015,   costPer1kOutput: 0.075,   enabled: true },
    { id: 'claude-sonnet-4',    name: 'Claude Sonnet 4',      provider: 'anthropic', modelId: 'claude-sonnet-4-20250514',   type: 'chat',      contextWindow: 200000, maxOutputTokens: 64000, costPer1kInput: 0.003,   costPer1kOutput: 0.015,   enabled: true },
    { id: 'claude-haiku-3-5',   name: 'Claude Haiku 3.5',     provider: 'anthropic', modelId: 'claude-3-5-haiku-20241022',  type: 'chat',      contextWindow: 200000, maxOutputTokens: 8192,  costPer1kInput: 0.0008,  costPer1kOutput: 0.004,   enabled: true },
    { id: 'gpt-4o',             name: 'GPT-4o',               provider: 'openai',    modelId: 'gpt-4o',                     type: 'chat',      contextWindow: 128000, maxOutputTokens: 16384, costPer1kInput: 0.0025,  costPer1kOutput: 0.01,    enabled: true },
    { id: 'gpt-4o-mini',        name: 'GPT-4o mini',          provider: 'openai',    modelId: 'gpt-4o-mini',               type: 'chat',      contextWindow: 128000, maxOutputTokens: 16384, costPer1kInput: 0.00015, costPer1kOutput: 0.0006,  enabled: true },
    { id: 'text-embedding-3-large', name: 'Embedding 3 Large', provider: 'openai',  modelId: 'text-embedding-3-large',     type: 'embedding', contextWindow: 8191,   maxOutputTokens: 0,     costPer1kInput: 0.00013, costPer1kOutput: 0,       enabled: true },
    { id: 'gemini-2-flash',     name: 'Gemini 2.0 Flash',     provider: 'google',    modelId: 'gemini-2.0-flash',          type: 'chat',      contextWindow: 1000000,maxOutputTokens: 8192,  costPer1kInput: 0.00010, costPer1kOutput: 0.0004,  enabled: true },
    { id: 'gemini-1-5-pro',     name: 'Gemini 1.5 Pro',       provider: 'google',    modelId: 'gemini-1.5-pro',            type: 'chat',      contextWindow: 2000000,maxOutputTokens: 8192,  costPer1kInput: 0.00125, costPer1kOutput: 0.005,   enabled: true },
    { id: 'mistral-large',      name: 'Mistral Large',        provider: 'mistral',   modelId: 'mistral-large-latest',      type: 'chat',      contextWindow: 128000, maxOutputTokens: 8192,  costPer1kInput: 0.002,   costPer1kOutput: 0.006,   enabled: true },
    { id: 'command-r-plus',     name: 'Command R+',           provider: 'cohere',    modelId: 'command-r-plus',            type: 'chat',      contextWindow: 128000, maxOutputTokens: 4096,  costPer1kInput: 0.0025,  costPer1kOutput: 0.01,    enabled: true },
];

const MODEL_BY_ID = new Map(MODEL_CATALOG.map((m) => [m.id, m]));

// ── Pagination + JSONB helpers (mirror featureFlagsService) ───────────────────
function paginate(items, total, page, limit) {
    const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
    return {
        success: true,
        data: items,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    };
}

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
function toNum(v, fallback = 0) {
    if (v == null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

// ── Audit (mirrors featureFlagsService: shared auth.audit_logs store) ──────────
async function audit(action, resourceType, resourceId, metadata, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';
    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, action, resource_type, resource_id, metadata, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        { bind: [adminUserId, action, resourceType, resourceId == null ? null : String(resourceId), JSON.stringify(metadata || {}), ip] },
    );
}

// ══ MODELS ════════════════════════════════════════════════════════════════════
// Catalog (static) merged with persisted overrides + live usage aggregates.
function modelDefaultsShape(m) {
    return {
        id:              m.id,
        name:            m.name,
        provider:        m.provider,
        modelId:         m.modelId,
        type:            m.type,
        contextWindow:   m.contextWindow,
        maxOutputTokens: m.maxOutputTokens,
        costPer1kInput:  m.costPer1kInput,
        costPer1kOutput: m.costPer1kOutput,
        enabled:         m.enabled,
        latencyP50Ms:    null,
        latencyP95Ms:    null,
        callsToday:      0,
        tokensToday:     0,
        errorRate:       0,
        createdAt:       null,
    };
}

async function fetchModelOverrides() {
    const db = getDb();
    const rows = await db.sequelize.query(
        `SELECT model_id, enabled, cost_per_1k_input, cost_per_1k_output FROM admin.ai_model_overrides`,
        { type: db.Sequelize.QueryTypes.SELECT },
    );
    const map = new Map();
    for (const r of rows) map.set(r.model_id, r);
    return map;
}

// Per-model usage for "today" (UTC day), aggregated from inference jobs.
async function fetchModelUsageToday() {
    const db = getDb();
    const rows = await db.sequelize.query(
        `SELECT model,
                COUNT(*)::int                                              AS calls,
                COALESCE(SUM(COALESCE(tokens_in, 0) + COALESCE(tokens_out, 0)), 0)::bigint AS tokens,
                COUNT(*) FILTER (WHERE status = 'failed')::int             AS errors
         FROM admin.ai_inference_jobs
         WHERE model IS NOT NULL
           AND created_at >= date_trunc('day', NOW())
         GROUP BY model`,
        { type: db.Sequelize.QueryTypes.SELECT },
    );
    const map = new Map();
    for (const r of rows) map.set(r.model, r);
    return map;
}

function applyOverride(base, ov) {
    if (!ov) return base;
    return {
        ...base,
        enabled:         ov.enabled === null || ov.enabled === undefined ? base.enabled : !!ov.enabled,
        costPer1kInput:  ov.cost_per_1k_input  == null ? base.costPer1kInput  : toNum(ov.cost_per_1k_input,  base.costPer1kInput),
        costPer1kOutput: ov.cost_per_1k_output == null ? base.costPer1kOutput : toNum(ov.cost_per_1k_output, base.costPer1kOutput),
    };
}

function applyUsage(model, usage) {
    if (!usage) return model;
    const calls = toNum(usage.calls, 0);
    const errors = toNum(usage.errors, 0);
    return {
        ...model,
        callsToday:  calls,
        tokensToday: toNum(usage.tokens, 0),
        errorRate:   calls > 0 ? errors / calls : 0,
    };
}

async function listModels() {
    await ensureSchema();
    const [overrides, usage] = await Promise.all([fetchModelOverrides(), fetchModelUsageToday()]);
    return MODEL_CATALOG.map((m) => {
        const base = applyOverride(modelDefaultsShape(m), overrides.get(m.id));
        return applyUsage(base, usage.get(m.id));
    });
}

async function getModel(id) {
    await ensureSchema();
    const catalog = MODEL_BY_ID.get(id);
    if (!catalog) throw new AppError('NOT_FOUND', 'Model not found', 404);
    const [overrides, usage] = await Promise.all([fetchModelOverrides(), fetchModelUsageToday()]);
    const base = applyOverride(modelDefaultsShape(catalog), overrides.get(id));
    return applyUsage(base, usage.get(id));
}

async function updateModel(id, patch, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();
    const catalog = MODEL_BY_ID.get(id);
    if (!catalog) throw new AppError('NOT_FOUND', 'Model not found', 404);

    const changed = {};
    let enabled = null;
    let costIn  = null;
    let costOut = null;

    if (patch.enabled !== undefined) { enabled = !!patch.enabled; changed.enabled = enabled; }
    if (patch.costPer1kInput !== undefined) {
        const n = Number(patch.costPer1kInput);
        if (!Number.isFinite(n) || n < 0) throw new AppError('VALIDATION_ERROR', 'costPer1kInput must be a non-negative number', 400);
        costIn = n; changed.costPer1kInput = n;
    }
    if (patch.costPer1kOutput !== undefined) {
        const n = Number(patch.costPer1kOutput);
        if (!Number.isFinite(n) || n < 0) throw new AppError('VALIDATION_ERROR', 'costPer1kOutput must be a non-negative number', 400);
        costOut = n; changed.costPer1kOutput = n;
    }

    if (Object.keys(changed).length === 0) {
        throw new AppError('VALIDATION_ERROR', 'No updatable fields provided (enabled, costPer1kInput, costPer1kOutput)', 400);
    }

    // Upsert the override. COALESCE on the UPDATE branch preserves any field not in
    // this patch (only the supplied columns change).
    await db.sequelize.query(
        `INSERT INTO admin.ai_model_overrides (model_id, enabled, cost_per_1k_input, cost_per_1k_output)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (model_id) DO UPDATE SET
            enabled            = COALESCE($2, admin.ai_model_overrides.enabled),
            cost_per_1k_input  = COALESCE($3, admin.ai_model_overrides.cost_per_1k_input),
            cost_per_1k_output = COALESCE($4, admin.ai_model_overrides.cost_per_1k_output),
            updated_at         = NOW()`,
        { bind: [id, enabled, costIn, costOut] },
    );

    await audit('ai.model.updated', 'ai_model', id, { changed, updatedBy: adminUserId }, adminUserId, ipAddress);
    logger.info({ modelId: id, adminUserId, event: 'admin.ai_model_updated' }, 'AI model override updated');
    eventBus.publish('admin.ai.model.updated', { id, changed }).catch(() => {});

    return getModel(id);
}

// ══ AGENTS ════════════════════════════════════════════════════════════════════
const AGENT_TYPES = ['assistant', 'workflow', 'rag', 'tool_use'];

function serializeAgent(row) {
    return {
        id:           String(row.id),
        name:         row.name,
        description:  row.description == null ? '' : row.description,
        type:         row.type,
        modelId:      row.model == null ? '' : row.model,
        systemPrompt: row.system_prompt == null ? '' : row.system_prompt,
        tools:        toArray(row.tools),
        enabled:      row.status === 'enabled',
        callsToday:   toNum(row.calls_today, 0),
        avgLatencyMs: Math.round(toNum(row.avg_latency_ms, 0)),
        successRate:  row.calls_today > 0 ? toNum(row.success_rate, 0) : 0,
        createdAt:    row.created_at,
    };
}

// Joins per-agent "today" usage (calls / avg latency / success rate) from jobs.
const AGENT_SELECT = `
    a.id, a.name, a.description, a.type, a.model, a.system_prompt, a.tools, a.status,
    a.created_at, a.updated_at,
    COALESCE(j.calls_today, 0)   AS calls_today,
    COALESCE(j.avg_latency_ms, 0) AS avg_latency_ms,
    COALESCE(j.success_rate, 0)  AS success_rate
    FROM admin.ai_agents a
    LEFT JOIN (
        SELECT agent_id,
               COUNT(*)::int AS calls_today,
               AVG(latency_ms) AS avg_latency_ms,
               (COUNT(*) FILTER (WHERE status = 'completed'))::float
                   / NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'failed')), 0) AS success_rate
        FROM admin.ai_inference_jobs
        WHERE created_at >= date_trunc('day', NOW())
        GROUP BY agent_id
    ) j ON j.agent_id = a.id`;

async function listAgents({ page = 1, limit = 50 } = {}) {
    await ensureSchema();
    const db     = getDb();
    const offset = (page - 1) * limit;

    const [rows, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT ${AGENT_SELECT}
             ORDER BY a.created_at DESC
             LIMIT $1 OFFSET $2`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [limit, offset] },
        ),
        db.sequelize.query(
            'SELECT COUNT(*)::int AS count FROM admin.ai_agents',
            { type: db.Sequelize.QueryTypes.SELECT },
        ),
    ]);

    return paginate(rows.map(serializeAgent), count, page, limit);
}

async function getAgent(id) {
    await ensureSchema();
    const db = getDb();
    const [row] = await db.sequelize.query(
        `SELECT ${AGENT_SELECT} WHERE a.id = $1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] },
    );
    if (!row) throw new AppError('NOT_FOUND', 'Agent not found', 404);
    return serializeAgent(row);
}

function normalizeAgentType(raw) {
    const t = typeof raw === 'string' ? raw.trim() : '';
    if (!AGENT_TYPES.includes(t)) {
        throw new AppError('VALIDATION_ERROR', `Invalid agent type; allowed: ${AGENT_TYPES.join(', ')}`, 400);
    }
    return t;
}

function normalizeTools(raw) {
    if (raw == null) return [];
    if (!Array.isArray(raw)) throw new AppError('VALIDATION_ERROR', 'tools must be an array', 400);
    return raw.map((v) => String(v));
}

async function createAgent(payload, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (!name || name.length > 255) throw new AppError('VALIDATION_ERROR', 'Agent name is required (max 255 chars)', 400);

    const type = payload.type === undefined ? 'assistant' : normalizeAgentType(payload.type);
    const description  = payload.description == null ? null : String(payload.description).trim() || null;
    const model        = payload.modelId == null ? null : String(payload.modelId).trim() || null;
    const systemPrompt = payload.systemPrompt == null ? null : String(payload.systemPrompt);
    const tools        = normalizeTools(payload.tools);
    const status       = payload.enabled === false ? 'disabled' : 'enabled';
    const config       = toObject(payload.config);

    const [created] = await db.sequelize.query(
        `INSERT INTO admin.ai_agents
            (name, description, type, model, system_prompt, tools, status, config)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb)
         RETURNING id`,
        {
            type: db.Sequelize.QueryTypes.SELECT,
            bind: [name, description, type, model, systemPrompt, JSON.stringify(tools), status, JSON.stringify(config)],
        },
    );

    await audit('ai.agent.created', 'ai_agent', created.id, { name, type, status, createdBy: adminUserId }, adminUserId, ipAddress);
    logger.info({ agentId: created.id, adminUserId, event: 'admin.ai_agent_created' }, 'AI agent created');
    eventBus.publish('admin.ai.agent.created', { id: String(created.id), name, type }).catch(() => {});

    return getAgent(created.id);
}

async function updateAgent(id, patch, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const [existing] = await db.sequelize.query(
        'SELECT id FROM admin.ai_agents WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] },
    );
    if (!existing) throw new AppError('NOT_FOUND', 'Agent not found', 404);

    const sets = [];
    const bind = [];
    const changed = {};

    if (patch.name !== undefined) {
        const name = typeof patch.name === 'string' ? patch.name.trim() : '';
        if (!name || name.length > 255) throw new AppError('VALIDATION_ERROR', 'Agent name must be 1-255 chars', 400);
        sets.push(`name = $${bind.length + 1}`); bind.push(name); changed.name = name;
    }
    if (patch.description !== undefined) {
        const description = patch.description == null ? null : String(patch.description).trim() || null;
        sets.push(`description = $${bind.length + 1}`); bind.push(description); changed.description = description;
    }
    if (patch.type !== undefined) {
        const type = normalizeAgentType(patch.type);
        sets.push(`type = $${bind.length + 1}`); bind.push(type); changed.type = type;
    }
    if (patch.modelId !== undefined) {
        const model = patch.modelId == null ? null : String(patch.modelId).trim() || null;
        sets.push(`model = $${bind.length + 1}`); bind.push(model); changed.modelId = model;
    }
    if (patch.systemPrompt !== undefined) {
        const systemPrompt = patch.systemPrompt == null ? null : String(patch.systemPrompt);
        sets.push(`system_prompt = $${bind.length + 1}`); bind.push(systemPrompt); changed.systemPrompt = true;
    }
    if (patch.tools !== undefined) {
        const tools = normalizeTools(patch.tools);
        sets.push(`tools = $${bind.length + 1}::jsonb`); bind.push(JSON.stringify(tools)); changed.tools = tools;
    }
    if (patch.config !== undefined) {
        const config = toObject(patch.config);
        sets.push(`config = $${bind.length + 1}::jsonb`); bind.push(JSON.stringify(config)); changed.config = true;
    }
    // toggle: { enabled } maps to status. Also accept explicit { status }.
    if (patch.enabled !== undefined) {
        const status = patch.enabled ? 'enabled' : 'disabled';
        sets.push(`status = $${bind.length + 1}`); bind.push(status); changed.status = status;
    } else if (patch.status !== undefined) {
        const status = String(patch.status).trim();
        if (!['enabled', 'disabled'].includes(status)) {
            throw new AppError('VALIDATION_ERROR', 'status must be enabled or disabled', 400);
        }
        sets.push(`status = $${bind.length + 1}`); bind.push(status); changed.status = status;
    }

    if (sets.length === 0) {
        throw new AppError(
            'VALIDATION_ERROR',
            'No updatable fields provided (name, description, type, modelId, systemPrompt, tools, config, enabled)',
            400,
        );
    }

    sets.push('updated_at = NOW()');
    bind.push(id);

    await db.sequelize.query(
        `UPDATE admin.ai_agents SET ${sets.join(', ')} WHERE id = $${bind.length}`,
        { bind },
    );

    await audit('ai.agent.updated', 'ai_agent', id, { changed, updatedBy: adminUserId }, adminUserId, ipAddress);
    logger.info({ agentId: id, adminUserId, event: 'admin.ai_agent_updated' }, 'AI agent updated');
    eventBus.publish('admin.ai.agent.updated', { id: String(id), changed }).catch(() => {});

    return getAgent(id);
}

// ══ PROMPTS ════════════════════════════════════════════════════════════════════
const PROMPT_STATUSES = ['draft', 'active', 'archived'];

// Derive {{variable}} placeholders from the template so the console's "N vars" reads true.
function extractVariables(template) {
    if (typeof template !== 'string') return [];
    const out = new Set();
    const re = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
    let m;
    while ((m = re.exec(template)) !== null) out.add(m[1]);
    return [...out];
}

function slugify(raw, fallbackName) {
    const rawBase = (raw != null && String(raw).trim() !== '') ? String(raw) : String(fallbackName || '');
    // Bound input length before regex to avoid polynomial ReDoS on pathological input.
    // The output is capped at 200 chars, so trimming the source to 2000 chars is behavior-preserving.
    const base = rawBase.slice(0, 2000);
    return base.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);
}

function serializePrompt(row) {
    const template = row.template == null ? '' : row.template;
    return {
        id:          String(row.id),
        name:        row.name,
        slug:        row.slug == null ? '' : row.slug,
        description: row.description == null ? '' : row.description,
        template,
        variables:   extractVariables(template),
        modelId:     row.model == null ? '' : row.model,
        version:     toNum(row.version, 1),
        status:      row.status,
        tags:        Array.isArray(row.tags) ? row.tags : toArray(row.tags),
        createdBy:   row.created_by == null ? '' : row.created_by,
        createdAt:   row.created_at,
        updatedAt:   row.updated_at,
    };
}

const PROMPT_COLS = `id, name, slug, description, template, model, version, status, tags,
                     created_by, created_at, updated_at`;

function normalizeTags(raw) {
    if (raw == null) return [];
    if (!Array.isArray(raw)) throw new AppError('VALIDATION_ERROR', 'tags must be an array', 400);
    return raw.map((v) => String(v));
}

async function listPrompts({ page = 1, limit = 50, status, tag } = {}) {
    await ensureSchema();
    const db     = getDb();
    const offset = (page - 1) * limit;

    const where = ['1=1'];
    const bind  = [];
    if (status) { where.push(`status = $${bind.length + 1}`); bind.push(String(status)); }
    if (tag)    { where.push(`$${bind.length + 1} = ANY(tags)`); bind.push(String(tag)); }
    const whereSql = where.join(' AND ');

    const [rows, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT ${PROMPT_COLS} FROM admin.ai_prompts
             WHERE ${whereSql}
             ORDER BY created_at DESC
             LIMIT $${bind.length + 1} OFFSET $${bind.length + 2}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [...bind, limit, offset] },
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS count FROM admin.ai_prompts WHERE ${whereSql}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind },
        ),
    ]);

    return paginate(rows.map(serializePrompt), count, page, limit);
}

async function getPrompt(id) {
    await ensureSchema();
    const db = getDb();
    const [row] = await db.sequelize.query(
        `SELECT ${PROMPT_COLS} FROM admin.ai_prompts WHERE id = $1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] },
    );
    if (!row) throw new AppError('NOT_FOUND', 'Prompt not found', 404);
    return serializePrompt(row);
}

async function createPrompt(payload, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (!name || name.length > 255) throw new AppError('VALIDATION_ERROR', 'Prompt name is required (max 255 chars)', 400);

    const slug        = slugify(payload.slug, name) || null;
    const description  = payload.description == null ? null : String(payload.description).trim() || null;
    const template     = payload.template == null ? '' : String(payload.template);
    const model        = payload.modelId == null ? null : String(payload.modelId).trim() || null;
    const tags         = normalizeTags(payload.tags);
    const createdBy    = adminUserId == null ? null : String(adminUserId);

    let status = 'draft';
    if (payload.status !== undefined) {
        status = String(payload.status).trim();
        if (!PROMPT_STATUSES.includes(status)) {
            throw new AppError('VALIDATION_ERROR', `Invalid status; allowed: ${PROMPT_STATUSES.join(', ')}`, 400);
        }
    }
    let version = 1;
    if (payload.version !== undefined) {
        version = parseInt(payload.version, 10);
        if (!Number.isInteger(version) || version < 1) throw new AppError('VALIDATION_ERROR', 'version must be an integer >= 1', 400);
    }

    const [created] = await db.sequelize.query(
        `INSERT INTO admin.ai_prompts
            (name, slug, description, template, model, version, status, tags, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        {
            type: db.Sequelize.QueryTypes.SELECT,
            bind: [name, slug, description, template, model, version, status, tags, createdBy],
        },
    );

    await audit('ai.prompt.created', 'ai_prompt', created.id, { name, status, version, createdBy: adminUserId }, adminUserId, ipAddress);
    logger.info({ promptId: created.id, adminUserId, event: 'admin.ai_prompt_created' }, 'AI prompt created');
    eventBus.publish('admin.ai.prompt.created', { id: String(created.id), name, status }).catch(() => {});

    return getPrompt(created.id);
}

async function updatePrompt(id, patch, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const [existing] = await db.sequelize.query(
        'SELECT id, name FROM admin.ai_prompts WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] },
    );
    if (!existing) throw new AppError('NOT_FOUND', 'Prompt not found', 404);

    const sets = [];
    const bind = [];
    const changed = {};

    if (patch.name !== undefined) {
        const name = typeof patch.name === 'string' ? patch.name.trim() : '';
        if (!name || name.length > 255) throw new AppError('VALIDATION_ERROR', 'Prompt name must be 1-255 chars', 400);
        sets.push(`name = $${bind.length + 1}`); bind.push(name); changed.name = name;
    }
    if (patch.slug !== undefined) {
        const slug = slugify(patch.slug, existing.name) || null;
        sets.push(`slug = $${bind.length + 1}`); bind.push(slug); changed.slug = slug;
    }
    if (patch.description !== undefined) {
        const description = patch.description == null ? null : String(patch.description).trim() || null;
        sets.push(`description = $${bind.length + 1}`); bind.push(description); changed.description = description;
    }
    if (patch.template !== undefined) {
        const template = patch.template == null ? '' : String(patch.template);
        sets.push(`template = $${bind.length + 1}`); bind.push(template); changed.template = true;
    }
    if (patch.modelId !== undefined) {
        const model = patch.modelId == null ? null : String(patch.modelId).trim() || null;
        sets.push(`model = $${bind.length + 1}`); bind.push(model); changed.modelId = model;
    }
    if (patch.version !== undefined) {
        const version = parseInt(patch.version, 10);
        if (!Number.isInteger(version) || version < 1) throw new AppError('VALIDATION_ERROR', 'version must be an integer >= 1', 400);
        sets.push(`version = $${bind.length + 1}`); bind.push(version); changed.version = version;
    }
    if (patch.status !== undefined) {
        const status = String(patch.status).trim();
        if (!PROMPT_STATUSES.includes(status)) {
            throw new AppError('VALIDATION_ERROR', `Invalid status; allowed: ${PROMPT_STATUSES.join(', ')}`, 400);
        }
        sets.push(`status = $${bind.length + 1}`); bind.push(status); changed.status = status;
    }
    if (patch.tags !== undefined) {
        const tags = normalizeTags(patch.tags);
        sets.push(`tags = $${bind.length + 1}`); bind.push(tags); changed.tags = tags;
    }

    if (sets.length === 0) {
        throw new AppError(
            'VALIDATION_ERROR',
            'No updatable fields provided (name, slug, description, template, modelId, version, status, tags)',
            400,
        );
    }

    sets.push('updated_at = NOW()');
    bind.push(id);

    await db.sequelize.query(
        `UPDATE admin.ai_prompts SET ${sets.join(', ')} WHERE id = $${bind.length}`,
        { bind },
    );

    await audit('ai.prompt.updated', 'ai_prompt', id, { changed, updatedBy: adminUserId }, adminUserId, ipAddress);
    logger.info({ promptId: id, adminUserId, event: 'admin.ai_prompt_updated' }, 'AI prompt updated');
    eventBus.publish('admin.ai.prompt.updated', { id: String(id), changed }).catch(() => {});

    return getPrompt(id);
}

async function deletePrompt(id, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const [existing] = await db.sequelize.query(
        'SELECT id, name FROM admin.ai_prompts WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] },
    );
    if (!existing) throw new AppError('NOT_FOUND', 'Prompt not found', 404);

    await audit('ai.prompt.deleted', 'ai_prompt', id, { name: existing.name, deletedBy: adminUserId }, adminUserId, ipAddress);

    await db.sequelize.query('DELETE FROM admin.ai_prompts WHERE id = $1', { bind: [id] });

    logger.warn({ promptId: id, adminUserId, event: 'admin.ai_prompt_deleted' }, 'AI prompt deleted');
    eventBus.publish('admin.ai.prompt.deleted', { id: String(id), name: existing.name }).catch(() => {});

    return { id: String(id), deleted: true };
}

// ══ INFERENCE QUEUE ════════════════════════════════════════════════════════════
function serializeJob(row) {
    return {
        id:           String(row.id),
        agentId:      row.agent_id == null ? '' : String(row.agent_id),
        modelId:      row.model == null ? '' : row.model,
        status:       row.status,
        priority:     toNum(row.priority, 0),
        inputTokens:  row.tokens_in == null ? null : toNum(row.tokens_in, 0),
        outputTokens: row.tokens_out == null ? null : toNum(row.tokens_out, 0),
        latencyMs:    row.latency_ms == null ? null : toNum(row.latency_ms, 0),
        error:        row.error == null ? null : row.error,
        createdAt:    row.created_at,
        completedAt:  row.completed_at == null ? null : row.completed_at,
    };
}

const JOB_COLS = `id, agent_id, model, provider, status, priority, tokens_in, tokens_out,
                  cost_usd, latency_ms, error, created_at, completed_at`;

async function listInferenceQueue({ page = 1, limit = 20, status } = {}) {
    await ensureSchema();
    const db     = getDb();
    const offset = (page - 1) * limit;

    const where = ['1=1'];
    const bind  = [];
    if (status) { where.push(`status = $${bind.length + 1}`); bind.push(String(status)); }
    const whereSql = where.join(' AND ');

    const [rows, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT ${JOB_COLS} FROM admin.ai_inference_jobs
             WHERE ${whereSql}
             ORDER BY
                CASE status WHEN 'processing' THEN 0 WHEN 'queued' THEN 1 ELSE 2 END,
                priority DESC,
                created_at DESC
             LIMIT $${bind.length + 1} OFFSET $${bind.length + 2}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [...bind, limit, offset] },
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS count FROM admin.ai_inference_jobs WHERE ${whereSql}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind },
        ),
    ]);

    return paginate(rows.map(serializeJob), count, page, limit);
}

// Retry a failed job: requeue it (clear error/latency/completion). Forward-only:
// only 'failed' jobs may be retried.
async function retryInference(id, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    const [job] = await db.sequelize.query(
        'SELECT id, status FROM admin.ai_inference_jobs WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [id] },
    );
    if (!job) throw new AppError('NOT_FOUND', 'Inference job not found', 404);
    if (job.status !== 'failed') {
        throw new AppError('INVALID_REQUEST', `Only failed jobs can be retried (current status: ${job.status})`, 400);
    }

    await db.sequelize.query(
        `UPDATE admin.ai_inference_jobs
         SET status = 'queued', error = NULL, latency_ms = NULL, completed_at = NULL
         WHERE id = $1`,
        { bind: [id] },
    );

    await audit('ai.inference.retried', 'ai_inference_job', id, { retriedBy: adminUserId }, adminUserId, ipAddress);
    logger.info({ jobId: id, adminUserId, event: 'admin.ai_inference_retried' }, 'AI inference job requeued');
    eventBus.publish('admin.ai.inference.retried', { id: String(id) }).catch(() => {});

    return { id: String(id), status: 'queued', requeued: true };
}

// ══ USAGE & COST ════════════════════════════════════════════════════════════════
const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

function providerForModel(modelKey) {
    if (!modelKey) return 'local';
    const cat = MODEL_BY_ID.get(modelKey);
    if (cat) return cat.provider;
    // fall back to a catalog modelId match
    const byModelId = MODEL_CATALOG.find((m) => m.modelId === modelKey);
    return byModelId ? byModelId.provider : 'local';
}

// GET /ai/usage/cost?period=7d|30d|90d → AiCostSummary, aggregated from jobs.
async function getCostSummary(periodRaw) {
    await ensureSchema();
    const db = getDb();
    const days = PERIOD_DAYS[periodRaw] || 30;

    const rows = await db.sequelize.query(
        `SELECT
            date_trunc('day', created_at)::date AS day,
            model,
            provider,
            COALESCE(SUM(cost_usd), 0)::float8  AS cost
         FROM admin.ai_inference_jobs
         WHERE created_at >= NOW() - ($1 || ' days')::interval
         GROUP BY 1, 2, 3
         ORDER BY 1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [String(days)] },
    );

    const byProvider = {};
    const byModel    = {};
    const trendMap   = new Map();
    let totalUsd = 0;

    for (const r of rows) {
        const cost = toNum(r.cost, 0);
        totalUsd += cost;
        const provider = r.provider || providerForModel(r.model);
        byProvider[provider] = (byProvider[provider] || 0) + cost;
        if (r.model) byModel[r.model] = (byModel[r.model] || 0) + cost;
        const dayKey = r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10);
        trendMap.set(dayKey, (trendMap.get(dayKey) || 0) + cost);
    }

    const trend = [...trendMap.entries()]
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([date, costUsd]) => ({ date, costUsd: round6(costUsd) }));

    // Simple linear forecast: average daily spend over the period projected to 30 days.
    const avgPerDay = days > 0 ? totalUsd / days : 0;
    const forecastUsd = round6(avgPerDay * 30);

    const roundMap = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, round6(v)]));

    return {
        totalUsd:   round6(totalUsd),
        byProvider: roundMap(byProvider),
        byModel:    roundMap(byModel),
        trend,
        forecastUsd,
    };
}

function round6(n) {
    return Math.round((Number(n) || 0) * 1e6) / 1e6;
}

// GET /ai/usage/tokens?from&to[&provider] → TokenUsageStat[]
async function getTokenUsage({ from, to, provider } = {}) {
    await ensureSchema();
    const db = getDb();

    const where = ['1=1'];
    const bind  = [];
    if (from) { where.push(`created_at >= $${bind.length + 1}`); bind.push(from); }
    if (to)   { where.push(`created_at <= $${bind.length + 1}`); bind.push(to); }
    if (provider) { where.push(`provider = $${bind.length + 1}`); bind.push(String(provider)); }
    const whereSql = where.join(' AND ');

    const rows = await db.sequelize.query(
        `SELECT
            date_trunc('day', created_at)::date AS day,
            provider,
            model,
            COALESCE(SUM(tokens_in), 0)::bigint  AS input_tokens,
            COALESCE(SUM(tokens_out), 0)::bigint AS output_tokens,
            COALESCE(SUM(cost_usd), 0)::float8   AS cost,
            COUNT(*)::int                        AS calls,
            COUNT(*) FILTER (WHERE status = 'failed')::int AS errors
         FROM admin.ai_inference_jobs
         WHERE ${whereSql}
         GROUP BY 1, 2, 3
         ORDER BY 1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind },
    );

    return rows.map((r) => {
        const dayKey = r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10);
        return {
            date:         dayKey,
            provider:     r.provider || providerForModel(r.model),
            inputTokens:  toNum(r.input_tokens, 0),
            outputTokens: toNum(r.output_tokens, 0),
            costUsd:      round6(r.cost),
            calls:        toNum(r.calls, 0),
            errors:       toNum(r.errors, 0),
        };
    });
}

// ══ VECTOR STORE ════════════════════════════════════════════════════════════════
// No vector store is provisioned by admin-service. Return an honest empty list so
// the console renders its empty state rather than fabricating collections.
async function listCollections() {
    await ensureSchema();
    return [];
}

async function getCollection(id) {
    await ensureSchema();
    throw new AppError('NOT_FOUND', 'Vector collection not found', 404);
}

// ══ SANDBOX ═════════════════════════════════════════════════════════════════════
// admin-service does not hold provider API keys and is not the inference path. The
// sandbox endpoint records the attempt and returns an honest no-execution ack so the
// console does not fabricate model output. (Wiring real execution requires routing
// through the AI/ml-service with provider credentials.)
async function testPrompt({ promptId, variables } = {}, adminUserId, ipAddress) {
    await ensureSchema();
    const db = getDb();

    if (!promptId) throw new AppError('VALIDATION_ERROR', 'promptId is required', 400);
    const [prompt] = await db.sequelize.query(
        'SELECT id, name FROM admin.ai_prompts WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [promptId] },
    );
    if (!prompt) throw new AppError('NOT_FOUND', 'Prompt not found', 404);

    await audit(
        'ai.sandbox.test_requested', 'ai_prompt', promptId,
        { variableKeys: variables && typeof variables === 'object' ? Object.keys(variables) : [], requestedBy: adminUserId, note: 'admin-service is not the inference path' },
        adminUserId, ipAddress,
    );
    logger.info({ promptId, adminUserId, event: 'admin.ai_sandbox_test' }, 'AI sandbox test requested (no-execution ack)');

    return {
        output: 'Sandbox execution is not available in admin-service: provider credentials and the inference path live in the AI/ml-service. The request was recorded.',
        tokensUsed: 0,
        latencyMs: 0,
    };
}

module.exports = {
    ensureSchema,
    // models
    listModels, getModel, updateModel,
    // agents
    listAgents, getAgent, createAgent, updateAgent,
    // prompts
    listPrompts, getPrompt, createPrompt, updatePrompt, deletePrompt,
    // inference queue
    listInferenceQueue, retryInference,
    // usage & cost
    getCostSummary, getTokenUsage,
    // vectors
    listCollections, getCollection,
    // sandbox
    testPrompt,
};
