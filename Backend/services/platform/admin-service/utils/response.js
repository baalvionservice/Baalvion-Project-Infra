'use strict';

function sendSuccess(req, res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data, requestId: req.requestId });
}

function sendPaginated(req, res, result) {
    res.status(200).json({ success: true, data: result, requestId: req.requestId });
}

module.exports = { sendSuccess, sendPaginated };
