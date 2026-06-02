'use strict';

/**
 * Customer self-service privacy/trust + KYC. Mounted under the authenticated
 * tenant router. Plus the public (signature-verified) KYC webhook.
 */

const db = require('../models');
const gdpr = require('../service/gdprService');
const kyc = require('../service/kycService');
const trustMetrics = require('../observability/trustMetrics');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const Q = db.Sequelize.QueryTypes;
const wrap = (h) => async (req, res, next) => { try { await h(req, res, next); } catch (e) { next(e); } };
const org = (req) => req.auth.organizationId;
const uid = (req) => req.auth.userId;

module.exports = {
  trustStatus: wrap(async (req, res) => {
    const [o] = await db.sequelize.query(`SELECT kyc_status, risk_level, status FROM organizations WHERE id = :org`, { replacements: { org: org(req) }, type: Q.SELECT });
    const [r] = await db.sequelize.query(`SELECT score, level, computed_at FROM risk_scores WHERE org_id = :org ORDER BY computed_at DESC LIMIT 1`, { replacements: { org: org(req) }, type: Q.SELECT });
    sendSuccess(req, res, { kycStatus: o?.kyc_status, riskLevel: o?.risk_level, accountStatus: o?.status, latestRisk: r || null });
  }),

  recordConsent: wrap(async (req, res) => {
    await gdpr.recordConsent({ orgId: org(req), userId: uid(req), purpose: req.body.purpose, granted: req.body.granted, version: req.body.version, ip: req.ip });
    sendSuccess(req, res, { ok: true });
  }),

  requestExport: wrap(async (req, res) => {
    const r = await gdpr.requestExport({ orgId: org(req), userId: uid(req), requestedBy: uid(req) });
    sendSuccess(req, res, { id: r.id, signature: r.signature, downloadUrl: `/v1/account/privacy/export/${r.id}/download` }, 201);
  }),

  downloadExport: wrap(async (req, res) => {
    // Re-gather under the caller's org (authorization already scoped by guard).
    const bundle = await gdpr.gatherOrgData(org(req));
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="baalvion-export-${org(req)}.json"`);
    res.end(JSON.stringify(bundle, null, 2));
  }),

  requestDelete: wrap(async (req, res) => {
    const r = await gdpr.requestDelete({ orgId: org(req), userId: req.body.scope === 'me' ? uid(req) : null, requestedBy: uid(req) });
    sendSuccess(req, res, r, 202);
  }),

  startKyc: wrap(async (req, res) => {
    const r = await kyc.start({ orgId: org(req), userId: uid(req), subjectType: req.body.subjectType || 'individual', country: req.body.country });
    sendSuccess(req, res, r, 201);
  }),

  kycAccessToken: wrap(async (req, res) => {
    const token = await kyc.accessToken(org(req));
    sendSuccess(req, res, { token });
  }),

  // Public webhook (raw body + HMAC verified). Mounted in index.js before json.
  kycWebhook: async (req, res) => {
    try {
      const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
      const digest = req.headers['x-payload-digest'];
      // Pass the Sumsub delivery timestamp for replay-window enforcement.
      const webhookTimestamp = req.headers['x-payload-timestamp'];
      if (!kyc.verifyWebhook(raw, digest, webhookTimestamp)) {
        return res.status(401).json({ success: false, error: { code: 'BAD_SIGNATURE' } });
      }
      const event = JSON.parse(raw);
      await kyc.handleWebhook(event);
      if (kyc.mapReview(event).status === 'rejected') trustMetrics.incKycFailure();
      return res.json({ success: true });
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'WEBHOOK_ERROR', message: err.message } });
    }
  },
};
