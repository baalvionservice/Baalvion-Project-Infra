'use strict';

/**
 * Report orchestration: definition CRUD, run execution (resolve rows → render →
 * persist artifact), run history/download, and schedule management + due-time math.
 */

const { Op } = require('sequelize');
const db = require('../models');
const queryRunner = require('./queryRunner');
const exporters = require('./exporters');
const events = require('./events');
const { AppError, Errors } = require('../utils/errors');

// ── parameter validation ──────────────────────────────────────────────────────

function coerce(type, v, name) {
    switch (type) {
        case 'number':  { const n = Number(v); if (Number.isNaN(n)) throw Errors.badRequest(`Parameter ${name} must be a number`); return n; }
        case 'integer': { const n = parseInt(v, 10); if (Number.isNaN(n)) throw Errors.badRequest(`Parameter ${name} must be an integer`); return n; }
        case 'boolean': return v === true || v === 'true' || v === 1 || v === '1';
        case 'date':
        case 'datetime':
        case 'string':
        default:        return String(v);
    }
}

/** Validate declared params (defaults + required), then merge any ad-hoc scalar inputs. */
function resolveParams(schema = [], input = {}) {
    const out = {};
    for (const p of Array.isArray(schema) ? schema : []) {
        let v = input[p.name];
        if (v === undefined || v === '') {
            if (p.default !== undefined) v = p.default;
            else if (p.required) throw Errors.badRequest(`Missing required parameter: ${p.name}`);
            else { out[p.name] = null; continue; }
        }
        out[p.name] = coerce(p.type, v, p.name);
    }
    // Allow ad-hoc scalar params the author referenced but didn't declare.
    for (const [k, v] of Object.entries(input || {})) {
        if (!(k in out) && (v === null || ['string', 'number', 'boolean'].includes(typeof v))) out[k] = v;
    }
    return out;
}

// ── definitions ───────────────────────────────────────────────────────────────

async function createDefinition(data, actor) {
    if (data.source_type === 'query' && !data.query_template) throw Errors.badRequest('query_template is required for source_type=query');
    if (data.source_type === 'query') queryRunner.assertReadOnly(data.query_template); // fail fast on a bad query
    const def = await db.ReportDefinition.create({
        org_id:         data.org_id ?? actor?.orgId ?? null,
        name:           data.name,
        description:    data.description ?? null,
        category:       data.category ?? null,
        source_type:    data.source_type || 'query',
        datasource:     data.datasource || 'default',
        query_template: data.query_template ?? null,
        params_schema:  data.params_schema ?? [],
        columns:        data.columns ?? [],
        default_format: data.default_format || 'csv',
        created_by:     actor?.userId ?? null,
    });
    return def.toJSON();
}

async function listDefinitions(orgScope, { category, status, limit = 50, offset = 0 } = {}) {
    const where = {};
    if (orgScope) where.org_id = orgScope;
    if (category) where.category = category;
    if (status) where.status = status;
    const { rows, count } = await db.ReportDefinition.findAndCountAll({
        where, order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 50, 200), offset: Number(offset) || 0,
    });
    return { items: rows.map((r) => r.toJSON()), total: count };
}

async function getDefinition(id, orgScope) {
    const def = await db.ReportDefinition.findByPk(id);
    if (!def) throw Errors.notFound('Report definition not found');
    if (orgScope && def.org_id && def.org_id !== orgScope) throw Errors.forbidden('Report belongs to another organization');
    return def;
}

async function updateDefinition(id, data, orgScope) {
    const def = await getDefinition(id, orgScope);
    const patch = {};
    for (const k of ['name', 'description', 'category', 'datasource', 'query_template', 'params_schema', 'columns', 'default_format', 'status']) {
        if (data[k] !== undefined) patch[k] = data[k];
    }
    if (patch.query_template) queryRunner.assertReadOnly(patch.query_template);
    patch.updated_at = new Date();
    await def.update(patch);
    return def.toJSON();
}

async function deleteDefinition(id, orgScope) {
    const def = await getDefinition(id, orgScope);
    await def.destroy();
    return { id, deleted: true };
}

// ── run execution ─────────────────────────────────────────────────────────────

/**
 * Execute a report. Resolves rows (read-only query or caller-supplied inline rows),
 * renders to the requested format, optionally persists the run + artifact, and
 * emits a `report.completed` event for downstream delivery.
 */
async function runReport({ definitionId, format, params = {}, inlineRows = null, trigger = 'manual', triggeredBy = null, orgScope = null, persist = true }) {
    const def = await getDefinition(definitionId, orgScope);
    const fmt = (format || def.default_format || 'csv').toLowerCase();
    const startedAt = Date.now();

    let run = null;
    if (persist) {
        run = await db.ReportRun.create({
            definition_id: def.id, org_id: def.org_id, status: 'running', format: fmt,
            params, trigger, triggered_by: triggeredBy,
        });
    }

    try {
        let rows; let columns = def.columns;
        if (def.source_type === 'inline') {
            if (!Array.isArray(inlineRows)) throw Errors.badRequest('source_type=inline requires an array of rows at run time');
            rows = inlineRows;
        } else {
            const resolved = resolveParams(def.params_schema, params);
            const result = await queryRunner.runQuery({ datasource: def.datasource, queryTemplate: def.query_template, params: resolved });
            rows = result.rows;
            if ((!columns || !columns.length) && result.columns?.length) columns = result.columns.map((k) => ({ key: k, label: k }));
        }

        const artifact = await exporters.render(fmt, { rows, columns, meta: { title: def.name } });
        const durationMs = Date.now() - startedAt;
        const byteSize = Buffer.byteLength(artifact.content, artifact.encoding === 'base64' ? 'base64' : 'utf8');

        if (persist) {
            await run.update({
                status: 'completed', row_count: rows.length, artifact: artifact.content,
                artifact_encoding: artifact.encoding, content_type: artifact.contentType,
                byte_size: byteSize, duration_ms: durationMs, completed_at: new Date(),
            });
            events.publish('report.completed', {
                reportId: def.id, runId: run.id, name: def.name, orgId: def.org_id,
                format: fmt, rowCount: rows.length, byteSize, triggeredBy,
            }).catch(() => {});
        }

        return {
            run: run ? run.toJSON() : null,
            report: { id: def.id, name: def.name },
            format: fmt, rowCount: rows.length, durationMs,
            artifact: { content: artifact.content, encoding: artifact.encoding, contentType: artifact.contentType, ext: artifact.ext },
        };
    } catch (err) {
        const e = err instanceof AppError ? err : new AppError('RUN_FAILED', err.message, 422);
        if (persist && run) {
            await run.update({ status: 'failed', error: e.message, duration_ms: Date.now() - startedAt, completed_at: new Date() }).catch(() => {});
            events.publish('report.failed', { reportId: def.id, runId: run.id, name: def.name, error: e.message }).catch(() => {});
        }
        throw e;
    }
}

async function listRuns(definitionId, orgScope, { limit = 50, offset = 0 } = {}) {
    if (definitionId) await getDefinition(definitionId, orgScope); // scope check
    const where = {};
    if (definitionId) where.definition_id = definitionId;
    if (orgScope) where.org_id = orgScope;
    const { rows, count } = await db.ReportRun.findAndCountAll({
        where, attributes: { exclude: ['artifact'] },
        order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 50, 200), offset: Number(offset) || 0,
    });
    return { items: rows.map((r) => r.toJSON()), total: count };
}

async function getRun(runId, orgScope, { withArtifact = false } = {}) {
    const run = await db.ReportRun.findByPk(runId);
    if (!run) throw Errors.notFound('Report run not found');
    if (orgScope && run.org_id && run.org_id !== orgScope) throw Errors.forbidden('Run belongs to another organization');
    const json = run.toJSON();
    if (!withArtifact) delete json.artifact;
    return json;
}

// ── schedules ─────────────────────────────────────────────────────────────────

/** Next fire time for an interval-based schedule (UTC). Always strictly in the future. */
function computeNextRun(sched, from = new Date()) {
    const base = new Date(from.getTime());
    const next = new Date(base.getTime());
    next.setUTCSeconds(0, 0);
    next.setUTCMinutes(sched.at_minute || 0);
    if (sched.cadence === 'hourly') {
        next.setUTCMinutes(sched.at_minute || 0);
        if (next <= base) next.setUTCHours(next.getUTCHours() + 1);
        return next;
    }
    next.setUTCHours(sched.at_hour || 0);
    if (sched.cadence === 'daily') {
        if (next <= base) next.setUTCDate(next.getUTCDate() + 1);
        return next;
    }
    if (sched.cadence === 'weekly') {
        const target = sched.at_weekday ?? 1;
        let delta = (target - next.getUTCDay() + 7) % 7;
        next.setUTCDate(next.getUTCDate() + delta);
        if (next <= base) next.setUTCDate(next.getUTCDate() + 7);
        return next;
    }
    if (sched.cadence === 'monthly') {
        next.setUTCDate(Math.min(sched.at_day || 1, 28));
        if (next <= base) next.setUTCMonth(next.getUTCMonth() + 1);
        return next;
    }
    // default daily
    if (next <= base) next.setUTCDate(next.getUTCDate() + 1);
    return next;
}

async function createSchedule(definitionId, data, actor, orgScope) {
    const def = await getDefinition(definitionId, orgScope);
    const sched = await db.ReportSchedule.create({
        definition_id: def.id, org_id: def.org_id, name: data.name ?? def.name,
        cadence: data.cadence || 'daily', at_minute: data.at_minute ?? 0, at_hour: data.at_hour ?? 6,
        at_weekday: data.at_weekday ?? null, at_day: data.at_day ?? null, timezone: data.timezone || 'UTC',
        format: data.format || def.default_format || 'csv', params: data.params ?? {},
        delivery: data.delivery ?? {}, enabled: data.enabled !== false, created_by: actor?.userId ?? null,
    });
    await sched.update({ next_run_at: computeNextRun(sched) });
    return sched.toJSON();
}

async function listSchedules(orgScope, { definitionId } = {}) {
    const where = {};
    if (orgScope) where.org_id = orgScope;
    if (definitionId) where.definition_id = definitionId;
    const rows = await db.ReportSchedule.findAll({ where, order: [['created_at', 'DESC']] });
    return rows.map((r) => r.toJSON());
}

async function updateSchedule(id, data, orgScope) {
    const sched = await db.ReportSchedule.findByPk(id);
    if (!sched) throw Errors.notFound('Schedule not found');
    if (orgScope && sched.org_id && sched.org_id !== orgScope) throw Errors.forbidden('Schedule belongs to another organization');
    const patch = {};
    for (const k of ['name', 'cadence', 'at_minute', 'at_hour', 'at_weekday', 'at_day', 'timezone', 'format', 'params', 'delivery', 'enabled']) {
        if (data[k] !== undefined) patch[k] = data[k];
    }
    await sched.update(patch);
    await sched.update({ next_run_at: computeNextRun(sched) });
    return sched.toJSON();
}

async function deleteSchedule(id, orgScope) {
    const sched = await db.ReportSchedule.findByPk(id);
    if (!sched) throw Errors.notFound('Schedule not found');
    if (orgScope && sched.org_id && sched.org_id !== orgScope) throw Errors.forbidden('Schedule belongs to another organization');
    await sched.destroy();
    return { id, deleted: true };
}

/** Schedules whose next_run_at is due. Used by the scheduler worker. */
async function dueSchedules(now = new Date()) {
    return db.ReportSchedule.findAll({
        where: { enabled: true, next_run_at: { [Op.lte]: now } },
        order: [['next_run_at', 'ASC']], limit: 50,
    });
}

/** Fire one due schedule: run the report, advance next_run_at, emit delivery event. */
async function fireSchedule(sched) {
    try {
        const out = await runReport({
            definitionId: sched.definition_id, format: sched.format, params: sched.params,
            trigger: 'schedule', triggeredBy: `schedule:${sched.id}`, orgScope: null,
        });
        events.publish('report.scheduled.delivered', {
            scheduleId: sched.id, reportId: sched.definition_id, runId: out.run?.id,
            delivery: sched.delivery, format: sched.format, rowCount: out.rowCount,
        }).catch(() => {});
        await sched.update({ last_run_at: new Date(), next_run_at: computeNextRun(sched, new Date(Date.now() + 1000)) });
        return { scheduleId: sched.id, runId: out.run?.id, status: 'ok' };
    } catch (err) {
        await sched.update({ last_run_at: new Date(), next_run_at: computeNextRun(sched, new Date(Date.now() + 1000)) }).catch(() => {});
        return { scheduleId: sched.id, status: 'error', error: err.message };
    }
}

module.exports = {
    resolveParams, computeNextRun,
    createDefinition, listDefinitions, getDefinition, updateDefinition, deleteDefinition,
    runReport, listRuns, getRun,
    createSchedule, listSchedules, updateSchedule, deleteSchedule, dueSchedules, fireSchedule,
};
