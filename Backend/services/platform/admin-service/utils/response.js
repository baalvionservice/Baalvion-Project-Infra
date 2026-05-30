'use strict';

function sendSuccess(req, res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data, requestId: req.requestId });
}

// Controllers call sendPaginated(req, res, items, total, page, limit). The console's
// data layer expects data:{ items, total, page, limit, hasMore } — emit exactly that
// (the previous 1-arg version silently dropped total/page/limit, breaking pagination).
function sendPaginated(req, res, items, total = null, page = 1, limit = null) {
    const count = Number.isFinite(total) ? total : (Array.isArray(items) ? items.length : 0);
    const lim   = Number.isFinite(limit) ? limit : (Array.isArray(items) ? items.length : 0);
    res.status(200).json({
        success: true,
        data: {
            items,
            total: count,
            page,
            limit: lim,
            hasMore: lim > 0 ? page * lim < count : false,
        },
        requestId: req.requestId,
    });
}

module.exports = { sendSuccess, sendPaginated };
