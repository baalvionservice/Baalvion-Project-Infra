'use strict';
const { sendSuccess } = require('../utils/response');
const invoiceService = require('../service/invoiceService');
const { actorOf } = require('../utils/actor');
const { generateSignedDownloadUrl } = require('@baalvion/upload');

// Owner/guest/staff: fetch an order's invoice (ownership enforced in-service). The stored pdfUrl
// is an S3 object key, not a public URL — mint a short-lived signed download link per request.
const getOrderInvoice = async (req, res, next) => {
    try {
        const invoice = await invoiceService.getOrderInvoice(req.params.storeId, req.params.orderId, actorOf(req));
        const downloadUrl = await generateSignedDownloadUrl(invoice.pdfUrl);
        return sendSuccess(req, res, { ...invoice, downloadUrl });
    } catch (err) { return next(err); }
};

module.exports = { getOrderInvoice };
