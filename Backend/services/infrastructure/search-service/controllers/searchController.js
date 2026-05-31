'use strict';
const { z } = require('zod');
const svc = require('../services/searchService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const parseSort = (s) => (!s ? undefined : String(s).split(',').map((p) => {
    const [field, order] = p.split(':');
    return { field, order: order === 'desc' ? 'desc' : 'asc' };
}));
const asBool = (v) => v === true || v === 'true' || v === '1';
const asInt = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

// ─── Search ──────────────────────────────────────────────────────────────────
exports.search = async (req, res) => {
    const r = await svc.searchIndex(req.params.index, {
        q:      req.query.q || '',
        from:   asInt(req.query.from, 0),
        size:   asInt(req.query.size, 20),
        fuzzy:  asBool(req.query.fuzzy),
        sort:   parseSort(req.query.sort),
        scoped: req.query.scoped === 'false' ? false : true,
    });
    sendSuccess(req, res, r);
};

const searchBody = z.object({
    query: z.string().optional(),
    filters: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
    from: z.number().int().min(0).optional(),
    size: z.number().int().min(1).max(200).optional(),
    sort: z.array(z.object({ field: z.string(), order: z.enum(['asc', 'desc']) })).optional(),
    highlight: z.array(z.string()).optional(),
    fuzzy: z.boolean().optional(),
    scoped: z.boolean().optional(),
});
exports.searchPost = async (req, res) => {
    const p = searchBody.safeParse(req.body);
    if (!p.success) throw new AppError('VALIDATION_ERROR', 'Invalid search body', 422, p.error.flatten());
    const r = await svc.searchIndex(req.params.index, { q: p.data.query || '', ...p.data });
    sendSuccess(req, res, r);
};

exports.autocomplete = async (req, res) => {
    const { field, prefix } = req.query;
    if (!field || !prefix) throw new AppError('VALIDATION_ERROR', 'field and prefix are required', 422);
    const r = await svc.autocompleteIndex(req.params.index, field, prefix, asInt(req.query.size, 10));
    sendSuccess(req, res, r);
};

const facetsBody = z.object({
    query: z.string().optional(),
    facetFields: z.array(z.string()).min(1),
    filters: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
    from: z.number().int().min(0).optional(),
    size: z.number().int().min(0).max(200).optional(),
    scoped: z.boolean().optional(),
});
exports.facets = async (req, res) => {
    const p = facetsBody.safeParse(req.body);
    if (!p.success) throw new AppError('VALIDATION_ERROR', 'Invalid facets body', 422, p.error.flatten());
    const r = await svc.facets(req.params.index, p.data.query, p.data.facetFields, p.data);
    sendSuccess(req, res, r);
};

// ─── Indexing (internal) ───────────────────────────────────────────────────────
const docBody = z.object({ id: z.string().min(1), doc: z.record(z.any()) });
exports.indexDoc = async (req, res) => {
    const p = docBody.safeParse(req.body);
    if (!p.success) throw new AppError('VALIDATION_ERROR', 'Expected { id, doc }', 422, p.error.flatten());
    sendSuccess(req, res, await svc.indexDoc(req.params.index, p.data.id, p.data.doc), 201);
};

const bulkBody = z.object({ items: z.array(z.object({ id: z.string().min(1), doc: z.record(z.any()) })).min(1).max(1000) });
exports.bulk = async (req, res) => {
    const p = bulkBody.safeParse(req.body);
    if (!p.success) throw new AppError('VALIDATION_ERROR', 'Expected { items: [{id, doc}] }', 422, p.error.flatten());
    sendSuccess(req, res, await svc.bulk(req.params.index, p.data.items), 201);
};

exports.updateDoc = async (req, res) => {
    const p = z.object({ doc: z.record(z.any()) }).safeParse(req.body);
    if (!p.success) throw new AppError('VALIDATION_ERROR', 'Expected { doc }', 422, p.error.flatten());
    sendSuccess(req, res, await svc.updateDoc(req.params.index, req.params.id, p.data.doc));
};

exports.deleteDoc = async (req, res) => {
    sendSuccess(req, res, await svc.deleteDoc(req.params.index, req.params.id));
};

// ─── Admin / meta ───────────────────────────────────────────────────────────────
exports.ensureIndices = async (req, res) => sendSuccess(req, res, await svc.ensureIndices(), 201);
exports.listIndices = async (req, res) => sendSuccess(req, res, { indices: svc.indices() });
