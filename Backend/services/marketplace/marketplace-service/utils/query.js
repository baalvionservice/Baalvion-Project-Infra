'use strict';
// Shared list-query helpers: pagination + safe, allowlisted sorting.
//
// Every list endpoint funnels through `parseListQuery` so the contract is identical across
// resources: ?page, ?limit (capped), ?sort=<column>&order=asc|desc. Sortable columns are
// allowlisted per resource — an unknown column is a 400, never an unguarded ORDER BY (which
// would let a caller inject arbitrary column names into the query).
const { AppError } = require('./errors');
const config = require('../config/appConfig');

const DEFAULT_LIMIT = config.pagination.defaultLimit;
const MAX_LIMIT = config.pagination.maxLimit;

const toPositiveInt = (value, fallback) => {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

/**
 * Parse pagination + sorting from a request query against a per-resource allowlist.
 *
 * @param {Record<string, unknown>} query - `req.query`
 * @param {object} opts
 * @param {string[]} opts.sortable - allowlisted snake_case columns that may be sorted
 * @param {[string, 'ASC'|'DESC']} [opts.defaultSort] - default order tuple
 * @param {number} [opts.defaultLimit] - per-resource override of the default page size
 * @param {number} [opts.maxLimit] - per-resource override of the global cap
 * @returns {{ page:number, limit:number, offset:number, sort:string, dir:'ASC'|'DESC', order:[ [string,string] ] }}
 */
function parseListQuery(query = {}, { sortable = [], defaultSort = ['created_at', 'DESC'], defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
    const page = toPositiveInt(query.page, 1);
    const limit = Math.min(toPositiveInt(query.limit, defaultLimit), maxLimit);
    const offset = (page - 1) * limit;

    // Sort column — accept ?sort= or ?sortBy=, allowlist-guarded.
    let sort = defaultSort[0];
    const requestedSort = (query.sort || query.sortBy || '').toString().trim();
    if (requestedSort) {
        if (!sortable.includes(requestedSort)) {
            throw new AppError(
                'INVALID_SORT',
                `Cannot sort by "${requestedSort}".`,
                400,
                { allowed: sortable },
            );
        }
        sort = requestedSort;
    }

    // Direction — accept ?order= or ?dir=, asc|desc only.
    let dir = (defaultSort[1] || 'DESC').toUpperCase();
    const requestedDir = (query.order || query.dir || '').toString().trim().toLowerCase();
    if (requestedDir) {
        if (requestedDir !== 'asc' && requestedDir !== 'desc') {
            throw new AppError('INVALID_ORDER', 'order must be "asc" or "desc".', 400);
        }
        dir = requestedDir.toUpperCase();
    }

    return { page, limit, offset, sort, dir, order: [[sort, dir]] };
}

/**
 * Standardize the paginated payload returned inside `{ success, data, meta }`.
 * @param {{ rows: unknown[], count: number, page: number, limit: number }} args
 */
function paginate({ rows, count, page, limit }) {
    return {
        items: rows,
        total: count,
        page,
        limit,
        totalPages: count === 0 ? 0 : Math.ceil(count / limit),
    };
}

module.exports = { parseListQuery, paginate, DEFAULT_LIMIT, MAX_LIMIT };
