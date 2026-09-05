'use strict';
/**
 * KYC/KYB vendor callbacks — mounted at /v1/kyc_provider.
 *
 * Unauthenticated by design: the caller is Onfido/Persona/Sumsub/Veriff, not a user
 * session. Authenticity comes from the vendor's own signature, which only its adapter
 * knows how to check — `parseWebhookVerdict` throwing is the rejection, and this route
 * turns that into a 401 rather than trusting the body.
 *
 * GET /providers is authenticated and read-only: it reports which adapters are
 * registered and which is active, so an operator can confirm a vendor swap took
 * effect without reading the process environment.
 */
const express = require('express');
const router = express.Router();
const db = require('../models');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getActiveProvider, supportedProviders } = require('../service/verification/kycProviders');
const { applyWebhook } = require('../service/verification/providerCheck');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

// Vendors sign the RAW body, so it must survive intact — a re-serialized JSON object
// will not match the signature. Keep the raw buffer alongside the parsed payload.
const rawJson = express.json({
    limit: '1mb',
    verify: (req, _res, buf) => { req.rawBody = buf; },
});

router.get('/providers', authMiddleware, (req, res) => {
    const active = getActiveProvider();
    return sendSuccess(req, res, {
        registered: supportedProviders(),
        active: active ? active.name : null,
        // Null active with registered adapters means KYC_PROVIDER is unset or names an
        // unregistered vendor; either way every decision stays human.
        mode: active ? 'automated' : 'manual_review_only',
    });
});

router.post('/webhook/:provider', rawJson, async (req, res, next) => {
    try {
        const result = await applyWebhook({
            providerName: req.params.provider,
            payload: req.body,
            headers: req.headers,
            rawBody: req.rawBody,
            db,
        });
        // 200 even when not applied: a vendor retries on a non-2xx, and "already
        // decided" or "progress event, not a verdict" are both correct outcomes.
        return sendSuccess(req, res, result);
    } catch (err) {
        // A signature failure surfaces from the adapter as a thrown error.
        return next(new AppError('INVALID_SIGNATURE', `callback rejected: ${err.message}`, 401));
    }
});

module.exports = router;
