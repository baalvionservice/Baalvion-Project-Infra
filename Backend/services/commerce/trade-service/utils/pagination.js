'use strict';
// Shared list-query parsing for the Logistics Core Foundation entities
// (containers/packages/addresses/tracking events), so filter/sort/paginate
// isn't reinvented per controller. Existing entities keep their own inline
// `page`/`limit` handling (see billOfLadingController.js) — this is additive,
// not a retrofit.
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

// allowedSort: array of column names the caller may sort by, to avoid passing
// an arbitrary column into `ORDER BY`.
function parseListQuery(query = {}, { allowedSort = ['created_at'] } = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
    const offset = (page - 1) * limit;

    let sortField = allowedSort[0];
    let sortDir = 'DESC';
    if (query.sort) {
        const raw = String(query.sort);
        const desc = raw.startsWith('-');
        const field = desc ? raw.slice(1) : raw;
        if (allowedSort.includes(field)) {
            sortField = field;
            sortDir = desc ? 'DESC' : 'ASC';
        }
    }

    return { page, limit, offset, order: [[sortField, sortDir]] };
}

module.exports = { parseListQuery, DEFAULT_LIMIT, MAX_LIMIT };
