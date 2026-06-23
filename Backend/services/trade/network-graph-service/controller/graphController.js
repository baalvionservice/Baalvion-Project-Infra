'use strict';
const { z } = require('zod');
const { getTenantContext } = require('@baalvion/tenancy');
const { read } = require('../config/neo4j');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { TEMPLATES, NODE_LABELS, EDGE_TYPES } = require('../graph/queries');
const projection = require('../services/projectionService');

const scope = () => { const c = getTenantContext() || {}; return { orgId: c.tenantId || null, bypass: !!c.bypass }; };

const nodeSchema = z.object({ label: z.string(), id: z.string(), props: z.record(z.any()).default({}) });
const edgeSchema = z.object({ type: z.string(), fromId: z.string(), toId: z.string(), props: z.record(z.any()).default({}) });
// Permissive: shape only (template must be a non-empty string, params an object).
// The allowlist (TEMPLATES[template]) still gates which template actually runs.
const querySchema = z.object({ template: z.string().min(1), params: z.record(z.any()).default({}) });

const upsertNode = async (req, res, next) => {
    try {
        const b = nodeSchema.parse(req.body || {});
        if (!NODE_LABELS.has(b.label)) return next(new AppError('BAD_REQUEST', `unknown label ${b.label}`, 422));
        const { orgId } = scope();
        await projection.upsertNode(b.label, b.id, { ...b.props, orgId });
        return sendSuccess(req, res, { label: b.label, id: b.id }, 201);
    } catch (err) { return next(err instanceof z.ZodError ? new AppError('BAD_REQUEST', err.errors[0].message, 422) : err); }
};

const createEdge = async (req, res, next) => {
    try {
        const b = edgeSchema.parse(req.body || {});
        if (!EDGE_TYPES.has(b.type)) return next(new AppError('BAD_REQUEST', `unknown edge ${b.type}`, 422));
        await projection.upsertEdge(b.type, b.fromId, b.toId, b.props);
        return sendSuccess(req, res, { type: b.type, fromId: b.fromId, toId: b.toId }, 201);
    } catch (err) { return next(err instanceof z.ZodError ? new AppError('BAD_REQUEST', err.errors[0].message, 422) : err); }
};

const neighbors = async (req, res, next) => {
    try {
        const { orgId, bypass } = scope();
        const { cypher } = TEMPLATES.neighbors({ id: req.params.id, direction: req.query.direction });
        const rows = await read(cypher, { id: req.params.id, orgId, bypass, type: req.query.type || null });
        return sendSuccess(req, res, { neighbors: rows });
    } catch (err) { return next(err); }
};

const paths = async (req, res, next) => {
    try {
        const { orgId, bypass } = scope();
        // F5: maxHops is inlined into the template as a clamped literal, not a Cypher param.
        const { cypher } = TEMPLATES.shortestPath({ maxHops: req.query.maxHops });
        const rows = await read(cypher, {
            fromId: req.query.fromId, toId: req.query.toId, orgId, bypass,
        });
        return sendSuccess(req, res, { paths: rows });
    } catch (err) { return next(err); }
};

const sanctionPath = async (req, res, next) => {
    try {
        const { cypher } = TEMPLATES.sanctionPath({ maxHops: req.query.maxHops });
        const rows = await read(cypher, { orgId: req.params.orgId });
        return sendSuccess(req, res, { exposure: rows, maxScore: rows[0]?.score ?? 0 });
    } catch (err) { return next(err); }
};

const query = async (req, res, next) => {
    try {
        const { template, params } = querySchema.parse(req.body || {});
        const fn = TEMPLATES[template];
        if (!fn) return next(new AppError('BAD_REQUEST', `unknown template '${template}'`, 422));
        const { orgId, bypass } = scope();
        const { cypher } = fn(params);
        const rows = await read(cypher, { ...params, orgId, bypass });
        return sendSuccess(req, res, { rows });
    } catch (err) { return next(err instanceof z.ZodError ? new AppError('BAD_REQUEST', err.errors[0].message, 422) : err); }
};

module.exports = { upsertNode, createEdge, neighbors, paths, sanctionPath, query };
