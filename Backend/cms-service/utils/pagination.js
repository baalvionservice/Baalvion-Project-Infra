/**
 * Parse pagination params from query string.
 * Returns { page, limit, offset }.
 */
const parsePagination = (query, maxLimit = 100) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

/**
 * Build standard paginated response envelope.
 */
const buildPaginated = (rows, count, { page, limit }) => ({
    data: rows,
    pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        hasNext: page * limit < count,
        hasPrev: page > 1,
    },
});

module.exports = { parsePagination, buildPaginated };
