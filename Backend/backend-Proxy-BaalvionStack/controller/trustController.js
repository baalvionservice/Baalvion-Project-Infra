'use strict';

/**
 * Admin Trust & Safety control plane (mounted under /v1/admin/trust, platform-admin).
 * Moderation cases, KYC review, enforcement, risk, destination intel, compliance.
 */

const db = require('../models');
const moderation = require('../service/moderationService');
const kyc = require('../service/kycService');
const enforcement = require('../service/enforcementService');
const risk = require('../service/riskEngine');
const destIntel = require('../service/destinationIntel');
const { sendSuccess } = require('../utils/response');

const Q = db.Sequelize.QueryTypes;
const wrap = (h) => async (req, res, next) => { try { await h(req, res, next); } catch (e) { next(e); } };
const actor = (req) => req.auth && req.auth.userId;

module.exports = {
  // ── Moderation ──
  listCases: wrap(async (req, res) => sendSuccess(req, res, await moderation.listCases(req.query))),
  caseHistory: wrap(async (req, res) => sendSuccess(req, res, await moderation.caseHistory(req.params.id))),
  createCase: wrap(async (req, res) => sendSuccess(req, res, await moderation.createCase(req.body), 201)),
  transitionCase: wrap(async (req, res) => sendSuccess(req, res, await moderation.transition({ caseId: req.params.id, toStatus: req.body.status, note: req.body.note, actorId: actor(req) }))),
  assignCase: wrap(async (req, res) => sendSuccess(req, res, await moderation.assign({ caseId: req.params.id, assigneeId: req.body.assigneeId, actorId: actor(req) }))),
  actOnCase: wrap(async (req, res) => sendSuccess(req, res, await moderation.actOn({ caseId: req.params.id, action: req.body.action, params: req.body.params, reason: req.body.reason, actorId: actor(req) }))),

  // ── KYC review ──
  listKyc: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT id, org_id, subject_type, provider, status, country, sanctions_hit, pep_hit, created_at
     FROM kyc_verifications ${req.query.status ? 'WHERE status = :s' : ''} ORDER BY created_at DESC LIMIT 200`,
    { replacements: { s: req.query.status }, type: Q.SELECT }))),
  decideKyc: wrap(async (req, res) => sendSuccess(req, res, await kyc.decide({ verificationId: req.params.id, decision: req.body.decision, reviewerId: actor(req), notes: req.body.notes }))),

  // ── Enforcement ──
  listEnforcement: wrap(async (req, res) => sendSuccess(req, res, await enforcement.listForOrg(req.params.orgId))),
  applyEnforcement: wrap(async (req, res) => sendSuccess(req, res, await enforcement.apply({ orgId: req.params.orgId, action: req.body.action, params: req.body.params, reason: req.body.reason, createdBy: actor(req) }), 201)),
  revokeEnforcement: wrap(async (req, res) => sendSuccess(req, res, await enforcement.revoke(req.params.id, actor(req)))),

  // ── Risk ──
  riskForOrg: wrap(async (req, res) => sendSuccess(req, res, await risk.evaluateOrg(req.params.orgId))),
  riskHistory: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT score, level, signals, computed_at FROM risk_scores WHERE org_id = :org ORDER BY computed_at DESC LIMIT 50`,
    { replacements: { org: req.params.orgId }, type: Q.SELECT }))),

  // ── Destination intel ──
  listDestIntel: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT indicator, kind, source, category, score, expires_at FROM destination_intel ORDER BY created_at DESC LIMIT 200`, { type: Q.SELECT }))),
  refreshDestIntel: wrap(async (req, res) => sendSuccess(req, res, await destIntel.refresh())),

  // ── Compliance report ──
  complianceReport: wrap(async (req, res) => {
    const grab = async (sql) => (await db.sequelize.query(sql, { type: Q.SELECT }))[0];
    sendSuccess(req, res, {
      kyc: await grab(`SELECT count(*) FILTER (WHERE status='approved') approved, count(*) FILTER (WHERE status='rejected') rejected, count(*) FILTER (WHERE status IN ('pending','review')) open FROM kyc_verifications`),
      moderation: await grab(`SELECT count(*) FILTER (WHERE status IN ('OPEN','INVESTIGATING','ESCALATED')) open, count(*) FILTER (WHERE status IN ('RESOLVED','REJECTED')) closed FROM moderation_cases`),
      enforcement: await grab(`SELECT count(*) FILTER (WHERE active) active FROM enforcement_actions`),
      gdpr: await grab(`SELECT count(*) FILTER (WHERE type='export') exports, count(*) FILTER (WHERE type='delete') deletions FROM gdpr_requests`),
      auditEntries: await grab(`SELECT count(*) n FROM compliance_audit_logs`),
    });
  }),
};
