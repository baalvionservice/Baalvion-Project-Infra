'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createTermSchema, updateTermSchema, listQuerySchema } = require('../validators/glossarySchemas');

const ADMIN_ROLES = ['admin', 'owner', 'super_admin', 'system'];
const isAdmin = (req) => (req.auth?.roles || []).some((r) => ADMIN_ROLES.includes(r));

const slugify = (s) =>
    String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 220);

const buildPagination = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit) });

// Validate with Zod → AppError(400) with flattened details (consumed by utils/response.sendError).
const validate = (schema, data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        const err = new AppError('VALIDATION_ERROR', 'Validation failed', 400);
        err.details = result.error.flatten();
        throw err;
    }
    return result.data;
};

// Replace a term's examples / relations inside a transaction. No-ops when the field is undefined
// (partial update), so PATCH without these keys leaves children untouched.
const syncChildren = async (termId, examples, relations, tx) => {
    if (Array.isArray(examples)) {
        await db.GlossaryExample.destroy({ where: { term_id: termId }, transaction: tx });
        if (examples.length) {
            await db.GlossaryExample.bulkCreate(
                examples.map((e, i) => ({ term_id: termId, title: e.title ?? null, body: e.body, sort_order: e.sort_order ?? i })),
                { transaction: tx },
            );
        }
    }
    if (Array.isArray(relations)) {
        await db.GlossaryRelation.destroy({ where: { term_id: termId }, transaction: tx });
        const seen = new Set();
        const candidates = [];
        for (const r of relations) {
            if (!r.related_id || r.related_id === termId) continue; // no self-edges
            const key = `${r.related_id}:${r.relation}`;
            if (seen.has(key)) continue;
            seen.add(key);
            candidates.push({ term_id: termId, related_id: r.related_id, relation: r.relation });
        }
        if (candidates.length) {
            // Only link to terms that actually exist — never persist orphan edges.
            const existing = await db.GlossaryTerm.findAll({
                where: { id: candidates.map((c) => c.related_id) }, attributes: ['id'], transaction: tx,
            });
            const existingIds = new Set(existing.map((t) => t.id));
            const rows = candidates.filter((c) => existingIds.has(c.related_id));
            if (rows.length) await db.GlossaryRelation.bulkCreate(rows, { transaction: tx });
        }
    }
};

// Full term with ordered examples + resolved related-term graph.
const loadFull = async (id) => {
    const term = await db.GlossaryTerm.findByPk(id);
    if (!term) return null;
    const [examples, relations] = await Promise.all([
        db.GlossaryExample.findAll({ where: { term_id: id }, order: [['sort_order', 'ASC']] }),
        db.GlossaryRelation.findAll({ where: { term_id: id } }),
    ]);
    const relatedIds = relations.map((r) => r.related_id);
    const relatedTerms = relatedIds.length
        ? await db.GlossaryTerm.findAll({ where: { id: relatedIds }, attributes: ['id', 'term', 'slug', 'difficulty'] })
        : [];
    const relatedMap = new Map(relatedTerms.map((t) => [t.id, t.toJSON()]));
    const out = term.toJSON();
    out.examples = examples.map((e) => e.toJSON());
    out.relations = relations.map((r) => ({
        id: r.id,
        related_id: r.related_id,
        relation: r.relation,
        related: relatedMap.get(r.related_id) || null,
    }));
    return out;
};

// GET /glossary  (public; an admin bearer via optionalAuth elevates to see all statuses)
const listTerms = async (req, res, next) => {
    try {
        const q = validate(listQuerySchema, req.query);
        const where = {};
        if (!isAdmin(req)) {
            where.status = 'published'; // public never sees drafts, regardless of requested status
        } else if (q.status && q.status !== 'all') {
            where.status = q.status;
        }
        if (q.difficulty) where.difficulty = q.difficulty;
        if (q.category) where.category = q.category;
        if (q.search) {
            where[Op.or] = [
                { term: { [Op.iLike]: `%${q.search}%` } },
                { short_def: { [Op.iLike]: `%${q.search}%` } },
            ];
        }
        const offset = (q.page - 1) * q.limit;
        const { count, rows } = await db.GlossaryTerm.findAndCountAll({ where, limit: q.limit, offset, order: [['term', 'ASC']] });
        return sendPaginated(req, res, { items: rows.map((r) => r.toJSON()), pagination: buildPagination(count, q.page, q.limit) });
    } catch (err) { return next(err); }
};

// GET /glossary/term/:slug  (public; admin may preview unpublished)
const getTermBySlug = async (req, res, next) => {
    try {
        const term = await db.GlossaryTerm.findOne({ where: { slug: req.params.slug } });
        if (!term || (term.status !== 'published' && !isAdmin(req))) {
            return next(new AppError('NOT_FOUND', 'Term not found', 404));
        }
        return sendSuccess(req, res, await loadFull(term.id));
    } catch (err) { return next(err); }
};

// GET /glossary/term/:slug/tooltip  (public hover-card payload)
const getTooltip = async (req, res, next) => {
    try {
        const term = await db.GlossaryTerm.findOne({
            where: { slug: req.params.slug, status: 'published' },
            attributes: ['id', 'term', 'slug', 'short_def', 'difficulty'],
        });
        if (!term) return next(new AppError('NOT_FOUND', 'Term not found', 404));
        db.GlossaryTerm.increment('view_count', { where: { id: term.id } }).catch(() => {});
        return sendSuccess(req, res, {
            term: term.term, slug: term.slug, shortDef: term.short_def, difficulty: term.difficulty, url: `/glossary/${term.slug}`,
        });
    } catch (err) { return next(err); }
};

// GET /glossary/:id  (admin — full record for the editor)
const getTermById = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin access required', 403));
        const full = await loadFull(req.params.id);
        if (!full) return next(new AppError('NOT_FOUND', 'Term not found', 404));
        return sendSuccess(req, res, full);
    } catch (err) { return next(err); }
};

// POST /glossary  (admin)
const createTerm = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin access required', 403));
        const data = validate(createTermSchema, req.body);
        const slug = data.slug || slugify(data.term);
        if (!slug) return next(new AppError('VALIDATION_ERROR', 'A valid slug or term is required', 400));

        const term = await db.sequelize.transaction(async (tx) => {
            const existing = await db.GlossaryTerm.findOne({ where: { slug }, transaction: tx });
            if (existing) throw new AppError('CONFLICT', 'A term with this slug already exists', 409);
            const created = await db.GlossaryTerm.create({
                term: data.term, slug, short_def: data.short_def, full_def: data.full_def,
                formula_latex: data.formula_latex ?? null, pronunciation: data.pronunciation ?? null,
                aliases: data.aliases, references: data.references, difficulty: data.difficulty,
                category: data.category ?? null, cms_content_id: data.cms_content_id ?? null, status: data.status,
                created_by: req.auth?.userId ?? null, updated_by: req.auth?.userId ?? null,
            }, { transaction: tx });
            await syncChildren(created.id, data.examples, data.relations, tx);
            return created;
        });
        return sendSuccess(req, res, await loadFull(term.id), 201);
    } catch (err) { return next(err); }
};

// PATCH /glossary/:id  (admin)
const updateTerm = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin access required', 403));
        const data = validate(updateTermSchema, req.body);

        const termId = await db.sequelize.transaction(async (tx) => {
            const term = await db.GlossaryTerm.findByPk(req.params.id, { transaction: tx });
            if (!term) throw new AppError('NOT_FOUND', 'Term not found', 404);
            const patch = {};
            for (const k of ['term', 'short_def', 'full_def', 'formula_latex', 'pronunciation', 'aliases', 'references', 'difficulty', 'category', 'cms_content_id', 'status']) {
                if (data[k] !== undefined) patch[k] = data[k];
            }
            if (data.slug !== undefined) {
                const nextSlug = data.slug || slugify(data.term || term.term);
                if (nextSlug && nextSlug !== term.slug) {
                    const dup = await db.GlossaryTerm.findOne({ where: { slug: nextSlug }, transaction: tx });
                    if (dup) throw new AppError('CONFLICT', 'A term with this slug already exists', 409);
                    patch.slug = nextSlug;
                }
            }
            patch.updated_by = req.auth?.userId ?? null;
            await term.update(patch, { transaction: tx });
            await syncChildren(term.id, data.examples, data.relations, tx);
            return term.id;
        });
        return sendSuccess(req, res, await loadFull(termId));
    } catch (err) { return next(err); }
};

// DELETE /glossary/:id  (admin)
const deleteTerm = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin access required', 403));
        const term = await db.GlossaryTerm.findByPk(req.params.id);
        if (!term) return next(new AppError('NOT_FOUND', 'Term not found', 404));
        await db.sequelize.transaction(async (tx) => {
            await db.GlossaryExample.destroy({ where: { term_id: term.id }, transaction: tx });
            await db.GlossaryRelation.destroy({ where: { [Op.or]: [{ term_id: term.id }, { related_id: term.id }] }, transaction: tx });
            await term.destroy({ transaction: tx });
        });
        return sendSuccess(req, res, { message: 'Term deleted' });
    } catch (err) { return next(err); }
};

module.exports = { listTerms, getTermBySlug, getTooltip, getTermById, createTerm, updateTerm, deleteTerm };
