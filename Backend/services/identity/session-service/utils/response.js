'use strict';
function sendSuccess(req, res, data = {}, statusCode = 200) {
    res.status(statusCode).json({ success: true, data, requestId: req.requestId });
}
function sendPaginated(req, res, items, total, page, limit) {
    res.json({ success: true, data: { items, total, page, limit, hasMore: page * limit < total }, requestId: req.requestId });
}
module.exports = { sendSuccess, sendPaginated };
