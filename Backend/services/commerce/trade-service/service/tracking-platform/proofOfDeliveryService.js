'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — proof-of-delivery capture.
 * OTP verification is self-contained (a random 6-digit code hashed into the
 * shipment's metadata with an expiry) rather than reusing utils/totp.js,
 * which is enrollment-based MFA (a persistent per-user secret) — a
 * delivery OTP is a single-use, short-lived code with no enrollment step.
 */
const crypto = require('crypto');
const db = require('../../models');
const realtime = require('../../realtime');
const { createAlert } = require('./alertEngine');

const OTP_TTL_MS = Number(process.env.POD_OTP_TTL_MS || 10 * 60 * 1000); // 10 minutes

function hashCode(code) {
    return crypto.createHash('sha256').update(String(code)).digest('hex');
}

/** Generate + persist (on the shipment's metadata) a delivery OTP. Returns the plaintext code. */
async function generateDeliveryOtp(shipmentId) {
    const shipment = await db.TradeShipment.findByPk(shipmentId);
    if (!shipment) throw new Error('shipment not found');
    const code = crypto.randomInt(100000, 999999).toString();
    await shipment.update({
        metadata: {
            ...(shipment.metadata || {}),
            podOtp: { hash: hashCode(code), expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString() },
        },
    });
    return code;
}

function verifyDeliveryOtp(shipment, code) {
    const otp = shipment.metadata && shipment.metadata.podOtp;
    if (!otp) return false;
    if (new Date(otp.expiresAt).getTime() < Date.now()) return false;
    return otp.hash === hashCode(code);
}

/**
 * Capture proof of delivery and advance the shipment to 'delivered'.
 * @param {object} opts
 * @param {string} opts.shipmentId
 * @param {string} [opts.receiverName]
 * @param {string} [opts.signatureUrl]
 * @param {string[]} [opts.photoUrls]
 * @param {string} [opts.barcode]
 * @param {string} [opts.qrCode]
 * @param {number} [opts.latitude]
 * @param {number} [opts.longitude]
 * @param {string} [opts.otpCode] — required if the shipment has a pending OTP
 * @param {string} [opts.notes]
 * @param {string} [opts.createdBy]
 */
async function capturePod({ shipmentId, receiverName, signatureUrl, photoUrls = [], barcode, qrCode, latitude, longitude, otpCode, notes, createdBy } = {}) {
    if (!shipmentId) throw new Error('shipmentId is required');
    const shipment = await db.TradeShipment.findByPk(shipmentId);
    if (!shipment) throw new Error('shipment not found');

    const hasPendingOtp = !!(shipment.metadata && shipment.metadata.podOtp);
    const otpVerified = hasPendingOtp ? verifyDeliveryOtp(shipment, otpCode) : false;
    if (hasPendingOtp && !otpVerified) throw new Error('invalid or expired OTP');

    const pod = await db.ProofOfDelivery.create({
        tenant_id: shipment.tenant_id,
        shipment_id: shipmentId,
        receiver_name: receiverName,
        signature_url: signatureUrl,
        photo_urls: photoUrls,
        barcode,
        qr_code: qrCode,
        latitude,
        longitude,
        otp_verified: otpVerified,
        notes,
        created_by: createdBy,
    });

    await shipment.update({
        status: 'delivered',
        actual_arrival: shipment.actual_arrival || new Date(),
        metadata: { ...(shipment.metadata || {}), podOtp: undefined },
    });

    await realtime.publish(`shipment:${shipmentId}`, 'status', { id: shipmentId, status: 'delivered' });
    await createAlert({
        shipmentId, alertType: 'delivered', severity: 'low',
        message: 'Shipment delivered — proof of delivery captured',
        metadata: { proofOfDeliveryId: pod.id },
        tenantId: shipment.tenant_id,
    });

    return pod;
}

module.exports = { generateDeliveryOtp, verifyDeliveryOtp, capturePod };
