'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — proof-of-delivery capture
 * (delegates capture/OTP logic to service/tracking-platform/proofOfDeliveryService.js).
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { auditLogistics } = require('../utils/logisticsAudit');
const podService = require('../service/tracking-platform/proofOfDeliveryService');

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, receiverName: r.receiver_name, signatureUrl: r.signature_url,
        photoUrls: r.photo_urls, barcode: r.barcode, qrCode: r.qr_code,
        latitude: r.latitude != null ? Number(r.latitude) : null,
        longitude: r.longitude != null ? Number(r.longitude) : null,
        deliveredAt: r.delivered_at, otpVerified: r.otp_verified, notes: r.notes, createdAt: r.created_at,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['delivered_at'] });
        const where = {};
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        const { count, rows } = await db.ProofOfDelivery.findAndCountAll({ where, limit, offset, order: [['delivered_at', 'DESC']] });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await db.ProofOfDelivery.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'Proof of delivery not found', 404));
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

// POST /proof_of_delivery/:shipmentId/otp — issue a delivery OTP (e.g. shown/sent to the receiver).
const issueOtp = async (req, res, next) => {
    try {
        const code = await podService.generateDeliveryOtp(req.params.shipmentId);
        // Returned directly (not SMS-dispatched) since carrier-to-receiver OTP
        // delivery channel is out of scope here — the caller (mobile driver
        // app) is expected to relay/display it.
        return sendSuccess(req, res, { otp: code, expiresInMs: Number(process.env.POD_OTP_TTL_MS || 600000) });
    } catch (err) {
        if (err.message === 'shipment not found') return next(new AppError('NOT_FOUND', err.message, 404));
        return next(err);
    }
};

const capture = async (req, res, next) => {
    try {
        const { shipmentId, receiverName, signatureUrl, photoUrls, barcode, qrCode, latitude, longitude, otpCode, notes } = req.body || {};
        if (!shipmentId) return next(new AppError('BAD_REQUEST', 'shipmentId is required', 400));
        const row = await podService.capturePod({
            shipmentId, receiverName, signatureUrl, photoUrls, barcode, qrCode, latitude, longitude, otpCode, notes,
            createdBy: req.auth && req.auth.userId,
        });
        await auditLogistics(req, 'proof_of_delivery.captured', 'proof_of_delivery', row.id, { shipmentId });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) {
        if (err.message === 'shipment not found') return next(new AppError('NOT_FOUND', err.message, 404));
        if (err.message === 'invalid or expired OTP') return next(new AppError('VALIDATION_ERROR', err.message, 400));
        return next(err);
    }
};

module.exports = { list, get, issueOtp, capture };
