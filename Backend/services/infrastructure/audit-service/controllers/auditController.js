'use strict';
const { z } = require('zod');
const auditService = require('../services/auditService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const writeSchema = z.object({
    action:        z.string().min(1).max(160),
    actorId:       z.string().max(64).optional(),
    orgId:         z.string().max(128).optional(),
    ip:            z.string().max(45).optional(),
    userAgent:     z.string().optional(),
    resourceType:  z.string().max(120).optional(),
    resourceId:    z.string().max(255).optional(),
    resource:      z.object({ type: z.string().optional(), id: z.string().optional() }).optional(),
    tenantId:      z.string().max(128).optional(),
    scopeId:       z.string().max(128).optional(),
    outcome:       z.enum(['success', 'deny', 'failure']).optional(),
    severity:      z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
    sourceService: z.string().max(80).optional(),
    appId:         z.string().max(80).optional(),
    correlationId: z.string().max(128).optional(),
    occurredAt:    z.string().datetime().optional(),
    metadata:      z.record(z.unknown()).optional(),
}).strip();

exports.write = async (req, res, next) => {
    try {
        const parsed = writeSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid audit event', 422, parsed.error.flatten());
        const event = { ...parsed.data, ip: parsed.data.ip || req.ip };
        const row = await auditService.append(event);
        sendSuccess(req, res, row, 201);
    } catch (err) { next(err); }
};

exports.writeBatch = async (req, res, next) => {
    try {
        const arr = z.array(writeSchema).max(500).safeParse(req.body?.events ?? req.body);
        if (!arr.success) throw new AppError('VALIDATION_ERROR', 'Expected an array of audit events', 422, arr.error.flatten());
        const rows = await auditService.appendBatch(arr.data);
        sendSuccess(req, res, { count: rows.length, items: rows }, 201);
    } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
    try { sendSuccess(req, res, await auditService.query(req.query)); }
    catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
    try { sendSuccess(req, res, await auditService.getBySeq(req.params.seq)); }
    catch (err) { next(err); }
};

exports.verify = async (req, res, next) => {
    try { sendSuccess(req, res, await auditService.verify({ fromSeq: req.query.fromSeq, toSeq: req.query.toSeq })); }
    catch (err) { next(err); }
};

exports.exportCsv = async (req, res, next) => {
    try {
        const csv = await auditService.exportEvents(req.query);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-export.csv"');
        res.status(200).send(csv);
    } catch (err) { next(err); }
};
