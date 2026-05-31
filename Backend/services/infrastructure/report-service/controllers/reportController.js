'use strict';
const { z } = require('zod');
const reportService = require('../services/reportService');
const exporters = require('../services/exporters');
const queryRunner = require('../services/queryRunner');
const config = require('../config/appConfig');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { orgScope } = require('../middleware/guards');

const columnSchema = z.object({ key: z.string(), label: z.string().optional(), type: z.string().optional(), format: z.string().optional() });
const paramSchema  = z.object({ name: z.string(), type: z.enum(['string', 'number', 'integer', 'boolean', 'date', 'datetime']).optional(), required: z.boolean().optional(), default: z.any().optional() });

const defSchema = z.object({
    name:           z.string().min(1).max(160),
    description:    z.string().max(2000).optional(),
    category:       z.string().max(80).optional(),
    source_type:    z.enum(['query', 'inline']).optional(),
    datasource:     z.string().max(64).optional(),
    query_template: z.string().max(20000).optional(),
    params_schema:  z.array(paramSchema).optional(),
    columns:        z.array(columnSchema).optional(),
    default_format: z.enum(exporters.FORMATS).optional(),
    org_id:         z.string().max(128).optional(),
}).strip();

function parse(schema, body) {
    const r = schema.safeParse(body);
    if (!r.success) throw new AppError('VALIDATION_ERROR', 'Invalid request body', 422, r.error.flatten());
    return r.data;
}

// ── definitions ──
exports.create = async (req, res) => sendSuccess(req, res, await reportService.createDefinition(parse(defSchema, req.body), req.auth), 201);
exports.list   = async (req, res) => sendSuccess(req, res, await reportService.listDefinitions(orgScope(req), req.query));
exports.get    = async (req, res) => sendSuccess(req, res, (await reportService.getDefinition(req.params.id, orgScope(req))).toJSON());
exports.update = async (req, res) => sendSuccess(req, res, await reportService.updateDefinition(req.params.id, parse(defSchema.partial(), req.body), orgScope(req)));
exports.remove = async (req, res) => sendSuccess(req, res, await reportService.deleteDefinition(req.params.id, orgScope(req)));

// ── run / preview / download ──
const runSchema = z.object({ format: z.enum(exporters.FORMATS).optional(), params: z.record(z.any()).optional(), inlineRows: z.array(z.record(z.any())).optional() }).strip();

exports.run = async (req, res) => {
    const body = parse(runSchema, req.body || {});
    const out = await reportService.runReport({
        definitionId: req.params.id, format: body.format, params: body.params || {},
        inlineRows: body.inlineRows || null, trigger: req.internal ? 'api' : 'manual',
        triggeredBy: req.auth?.userId, orgScope: orgScope(req),
    });
    if (String(req.query.download) === '1' || String(req.query.download) === 'true') {
        const { content, encoding, contentType, ext } = out.artifact;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${out.report.name.replace(/[^a-z0-9_-]+/gi, '_')}.${ext}"`);
        return res.status(200).send(encoding === 'base64' ? Buffer.from(content, 'base64') : content);
    }
    // metadata only (artifact retrievable via /runs/:id/download)
    return sendSuccess(req, res, { run: out.run, format: out.format, rowCount: out.rowCount, durationMs: out.durationMs }, 201);
};

exports.preview = async (req, res) => {
    const body = parse(runSchema, req.body || {});
    const out = await reportService.runReport({
        definitionId: req.params.id, format: 'json', params: body.params || {},
        inlineRows: body.inlineRows || null, trigger: 'manual', triggeredBy: req.auth?.userId,
        orgScope: orgScope(req), persist: false,
    });
    const data = JSON.parse(out.artifact.content);
    return sendSuccess(req, res, { columns: data.columns, rows: data.rows.slice(0, 100), rowCount: out.rowCount, durationMs: out.durationMs });
};

exports.listRuns = async (req, res) => sendSuccess(req, res, await reportService.listRuns(req.params.id, orgScope(req), req.query));
exports.getRun   = async (req, res) => sendSuccess(req, res, await reportService.getRun(req.params.runId, orgScope(req)));

exports.download = async (req, res) => {
    const run = await reportService.getRun(req.params.runId, orgScope(req), { withArtifact: true });
    if (run.status !== 'completed' || !run.artifact) throw new AppError('NOT_FOUND', 'No artifact for this run', 404);
    const ext = (run.content_type || '').includes('sheet') ? 'xlsx' : (run.content_type || '').includes('pdf') ? 'pdf' : (run.content_type || '').includes('json') ? 'json' : (run.content_type || '').includes('html') ? 'html' : 'csv';
    res.setHeader('Content-Type', run.content_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="report-${run.id}.${ext}"`);
    return res.status(200).send(run.artifact_encoding === 'base64' ? Buffer.from(run.artifact, 'base64') : run.artifact);
};

// ── schedules ──
const schedSchema = z.object({
    name: z.string().max(160).optional(),
    cadence: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
    at_minute: z.number().int().min(0).max(59).optional(),
    at_hour: z.number().int().min(0).max(23).optional(),
    at_weekday: z.number().int().min(0).max(6).optional(),
    at_day: z.number().int().min(1).max(28).optional(),
    timezone: z.string().max(48).optional(),
    format: z.enum(exporters.FORMATS).optional(),
    params: z.record(z.any()).optional(),
    delivery: z.record(z.any()).optional(),
    enabled: z.boolean().optional(),
}).strip();

exports.createSchedule = async (req, res) => sendSuccess(req, res, await reportService.createSchedule(req.params.id, parse(schedSchema, req.body || {}), req.auth, orgScope(req)), 201);
exports.listSchedules  = async (req, res) => sendSuccess(req, res, await reportService.listSchedules(orgScope(req), { definitionId: req.params.id }));
exports.updateSchedule = async (req, res) => sendSuccess(req, res, await reportService.updateSchedule(req.params.id, parse(schedSchema, req.body || {}), orgScope(req)));
exports.deleteSchedule = async (req, res) => sendSuccess(req, res, await reportService.deleteSchedule(req.params.id, orgScope(req)));

// ── meta ──
exports.formats     = async (req, res) => sendSuccess(req, res, { formats: exporters.FORMATS });
exports.datasources = async (req, res) => sendSuccess(req, res, { datasources: Object.keys(config.reports.datasources) });
