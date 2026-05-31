'use strict';

/**
 * OpenAPI spec catalog. Services register their OpenAPI documents here; the
 * developer portal lists them and serves the raw JSON (public specs are readable
 * without org scoping so a docs site can render them).
 */

const db = require('../models');
const { Errors } = require('../utils/errors');

function looksLikeOpenApi(spec) {
    return spec && typeof spec === 'object' && (spec.openapi || spec.swagger) && spec.info;
}

async function upsert({ service, title, version = '1.0.0', spec, isPublic = false, actorId }) {
    if (!looksLikeOpenApi(spec)) throw Errors.badRequest('spec must be an OpenAPI/Swagger document (needs openapi|swagger + info)');
    const [row, created] = await db.ApiSpec.findOrCreate({
        where: { service, version },
        defaults: { service, title: title || spec.info?.title || service, version, spec, is_public: !!isPublic, created_by: actorId ?? null },
    });
    if (!created) await row.update({ title: title || spec.info?.title || service, spec, is_public: !!isPublic, updated_at: new Date() });
    return row.toJSON();
}

async function list({ publicOnly = false } = {}) {
    const where = publicOnly ? { is_public: true, status: 'active' } : { status: 'active' };
    const rows = await db.ApiSpec.findAll({ where, attributes: { exclude: ['spec'] }, order: [['service', 'ASC'], ['version', 'DESC']] });
    return rows.map((r) => r.toJSON());
}

async function get({ service, version }, { publicOnly = false } = {}) {
    const where = { service };
    if (version) where.version = version;
    if (publicOnly) where.is_public = true;
    const row = await db.ApiSpec.findOne({ where, order: [['version', 'DESC']] });
    if (!row) throw Errors.notFound('Spec not found');
    return row.toJSON();
}

async function remove({ service, version }) {
    const n = await db.ApiSpec.destroy({ where: { service, version } });
    if (!n) throw Errors.notFound('Spec not found');
    return { service, version, deleted: true };
}

module.exports = { upsert, list, get, remove, looksLikeOpenApi };
