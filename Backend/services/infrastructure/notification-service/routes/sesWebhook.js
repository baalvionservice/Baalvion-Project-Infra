'use strict';

/**
 * Amazon SNS → SES event webhook.
 *
 *   POST /webhooks/aws/ses
 *
 * SNS delivers SES events (Bounce, Complaint, Delivery, Reject, DeliveryDelay, Rendering
 * Failure, Send, Subscription) as JSON. We:
 *   1. Read the RAW body (SNS signs the raw bytes; a re-serialized body would fail verification).
 *   2. Verify the SNS signature (handled inside @baalvion/email — host-allowlisted cert, fail-closed).
 *   3. Auto-confirm SubscriptionConfirmation.
 *   4. Persist delivery status to the shared Redis store.
 */
const express = require('express');
const { handleSnsRequest } = require('@baalvion/email');
const ses = require('../service/sesMailer');
const logger = require('../utils/logger');

const router = express.Router();

// Raw text body: SNS sets Content-Type: text/plain and signs the exact bytes.
router.post('/', express.text({ type: '*/*', limit: '256kb' }), async (req, res) => {
    try {
        const result = await handleSnsRequest({
            body: req.body,
            store: ses.getDeliveryStore(),
            logger,
            // Verification can be disabled ONLY for local testing via an explicit env flag.
            verify: process.env.SES_WEBHOOK_VERIFY !== 'false',
        });
        // Always 200 on success so SNS does not retry a correctly-processed message.
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        const status = err.statusCode || 400;
        logger.warn({ err: err.message, status }, '[ses-webhook] rejected');
        return res.status(status).json({ success: false, error: { message: err.message } });
    }
});

module.exports = router;
