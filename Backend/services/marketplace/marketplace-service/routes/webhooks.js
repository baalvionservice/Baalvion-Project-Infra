'use strict';
/**
 * Provider callbacks — the ONLY paths that can record a signature as signed or an escrow as
 * funded. Both were previously ordinary endpoints a party could call, which meant a deal could
 * reach "signed and funded" with no signature and no money.
 *
 * Mounted OUTSIDE the /v1 auth chain: the caller is a provider, not a user. Trust comes from the
 * signature on the request body, verified against the shared secret, and from nothing else.
 * The raw body is required for that verification, so these routes parse it themselves.
 */
const router = require('express').Router();
const express = require('express');
const escrowProvider = require('../integrations/escrow');
const service = require('../service/dealService');
const audit = require('../utils/audit');

const raw = express.raw({ type: 'application/json', limit: '256kb' });

const parse = (req) => { try { return JSON.parse(req.body.toString('utf8')); } catch { return null; } };

router.post('/escrow', raw, async (req, res) => {
    const signature = req.headers['x-escrow-signature'];
    if (!escrowProvider.verifyWebhook(req.body, signature)) {
        // Do not say which part failed; an unverified caller learns nothing from us.
        audit.record({ action: 'escrow.webhook.rejected', outcome: 'deny', severity: 'high', resourceType: 'escrow_transaction', metadata: { reason: 'bad_signature' } });
        return res.status(401).json({ success: false, error: { code: 'INVALID_SIGNATURE' } });
    }
    const body = parse(req);
    if (!body?.escrow_ref || !body?.event) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_PAYLOAD' } });
    }
    try {
        if (body.event === 'escrow.funded') {
            const row = await service.confirmEscrowFunding({ escrowRef: body.escrow_ref, amount: body.amount });
            return res.json({ success: true, data: { id: row.id, status: row.status } });
        }
        // Unknown events are acknowledged so the provider stops retrying, but change nothing.
        return res.json({ success: true, data: { ignored: body.event } });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'ERROR', message: err.message } });
    }
});

router.post('/esign', raw, async (req, res) => {
    // The e-signature provider shares the escrow webhook secret convention; a provider-specific
    // scheme replaces verifyWebhook when the concrete integration lands.
    const signature = req.headers['x-esign-signature'];
    if (!escrowProvider.verifyWebhook(req.body, signature)) {
        audit.record({ action: 'esign.webhook.rejected', outcome: 'deny', severity: 'high', resourceType: 'signature', metadata: { reason: 'bad_signature' } });
        return res.status(401).json({ success: false, error: { code: 'INVALID_SIGNATURE' } });
    }
    const body = parse(req);
    if (!body?.envelope_id || !body?.event) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_PAYLOAD' } });
    }
    try {
        if (body.event === 'envelope.completed') {
            const row = await service.completeSignatureFromProvider({
                envelopeId: body.envelope_id, auditUrl: body.audit_url, signedAt: body.signed_at,
            });
            return res.json({ success: true, data: { id: row.id, status: row.status } });
        }
        return res.json({ success: true, data: { ignored: body.event } });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'ERROR', message: err.message } });
    }
});

module.exports = router;
