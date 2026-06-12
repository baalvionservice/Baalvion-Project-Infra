'use strict';

/**
 * KYC/KYB onboarding verification. Provider-agnostic with a real Sumsub adapter
 * (request signing + webhook HMAC verification per Sumsub's documented scheme).
 * Config-driven: SUMSUB_APP_TOKEN / SUMSUB_SECRET / SUMSUB_WEBHOOK_SECRET. Without
 * config it runs in MANUAL mode (compliance officer decides) — no fabricated
 * verification results.
 *
 * Gates org activation: a high-risk product (proxy) should require approved KYC
 * before live proxy keys work — enforced via organizations.kyc_status.
 */

const crypto = require('crypto');
const db = require('../models');
const complianceAudit = require('./complianceAudit');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const APP_TOKEN = process.env.SUMSUB_APP_TOKEN || '';
const APP_SECRET = process.env.SUMSUB_SECRET || '';
const WEBHOOK_SECRET = process.env.SUMSUB_WEBHOOK_SECRET || '';
const BASE = process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com';
const configured = Boolean(APP_TOKEN && APP_SECRET);

// Sumsub request signing: HMAC-SHA256(secret, ts + METHOD + path + body).
async function signedFetch(method, path, body) {
  const ts = Math.floor(Date.now() / 1000);
  const payload = body ? JSON.stringify(body) : '';
  const sig = crypto.createHmac('sha256', APP_SECRET).update(ts + method + path + payload).digest('hex');
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'X-App-Token': APP_TOKEN,
      'X-App-Access-Sig': sig,
      'X-App-Access-Ts': String(ts),
      'Content-Type': 'application/json',
    },
    body: payload || undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`sumsub ${path} -> ${res.status}`);
  return res.json();
}

/** Start verification: create a local record (+ a Sumsub applicant if configured). */
async function start({ orgId, userId, subjectType = 'individual', country = null }) {
  let provider = 'manual';
  let applicantId = null;
  if (configured) {
    provider = 'sumsub';
    const levelName = subjectType === 'business' ? 'kyb-level' : 'basic-kyc-level';
    const applicant = await signedFetch('POST', `/resources/applicants?levelName=${levelName}`, {
      externalUserId: `org_${orgId}`,
    });
    applicantId = applicant.id;
  }
  await db.sequelize.query(
    `INSERT INTO kyc_verifications (org_id, user_id, subject_type, provider, applicant_id, status, country)
     VALUES (:org, :user, :type, :prov, :app, 'pending', :country)`,
    { replacements: { org: orgId, user: userId || null, type: subjectType, prov: provider, app: applicantId, country }, type: Q.INSERT },
  );
  await db.organizations.update({ kyc_status: 'pending' }, { where: { id: orgId } });
  await complianceAudit.log({ domain: 'kyc', action: 'start', orgId, actorId: userId, payload: { provider, subjectType } });
  return { provider, applicantId };
}

/** SDK access token for the in-app verification flow (Sumsub WebSDK / mobile). */
async function accessToken(orgId, ttlSecs = 600) {
  if (!configured) throw new Error('KYC provider not configured');
  const data = await signedFetch('POST', `/resources/accessTokens?userId=org_${orgId}&ttlInSecs=${ttlSecs}`, {});
  return data.token;
}

// Maximum age (in milliseconds) we accept for a KYC webhook timestamp. Sumsub
// sends X-Payload-Timestamp (Unix seconds) on every delivery — reject anything
// older than 5 minutes to prevent replay attacks.
const WEBHOOK_REPLAY_WINDOW_MS = Number(process.env.WEBHOOK_REPLAY_WINDOW_MS || 5 * 60 * 1000);

/**
 * Verify a Sumsub webhook.
 *  - digest: x-payload-digest = HMAC-SHA256(rawBody, webhookSecret)
 *  - timestampHeader: x-payload-timestamp (Unix epoch seconds, optional but
 *    verified when present to prevent replay attacks)
 *
 * Returns false if the secret is missing, the HMAC is wrong, or the timestamp
 * is outside the replay window.
 */
function verifyWebhook(rawBody, digest, timestampHeader) {
  if (!WEBHOOK_SECRET || !digest) return false;

  // Replay-window check — only enforced when a timestamp header is present.
  if (timestampHeader !== undefined && timestampHeader !== null && timestampHeader !== '') {
    const ts = Number(timestampHeader);
    if (!Number.isFinite(ts) || ts <= 0) return false; // malformed timestamp
    const ageMs = Date.now() - ts * 1000;
    if (ageMs > WEBHOOK_REPLAY_WINDOW_MS || ageMs < -60_000) {
      // Reject stale (> replay window) or futuristic (> 1 min ahead) payloads.
      logger.warn(`[kyc] webhook timestamp out of window age=${ageMs}ms`);
      return false;
    }
  }

  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(digest));
  } catch { return false; }
}

// Map Sumsub reviewResult → our status + risk flags.
function mapReview(review) {
  const answer = review && review.reviewResult && review.reviewResult.reviewAnswer; // GREEN | RED
  const rejectLabels = (review && review.reviewResult && review.reviewResult.rejectLabels) || [];
  return {
    status: answer === 'GREEN' ? 'approved' : answer === 'RED' ? 'rejected' : 'review',
    sanctionsHit: rejectLabels.includes('SANCTIONS') || rejectLabels.includes('BLOCKLIST'),
    pepHit: rejectLabels.includes('PEP'),
  };
}

async function handleWebhook(event) {
  const applicantId = event.applicantId || event.externalUserId;
  if (!applicantId) return;
  const mapped = mapReview(event);

  const [row] = await db.sequelize.query(
    `UPDATE kyc_verifications
     SET status = :status, sanctions_hit = :s, pep_hit = :p, raw = :raw::jsonb, updated_at = now()
     WHERE applicant_id = :app OR org_id = NULLIF(replace(:ext,'org_',''),'')::uuid
     RETURNING org_id`,
    { replacements: { status: mapped.status, s: mapped.sanctionsHit, p: mapped.pepHit, raw: JSON.stringify(event), app: event.applicantId || '', ext: applicantId }, type: Q.SELECT },
  ).then((r) => r).catch(() => [null]);

  if (row) {
    await db.organizations.update({ kyc_status: mapped.status }, { where: { id: row.org_id } });
    await complianceAudit.log({ domain: 'kyc', action: `webhook:${mapped.status}`, orgId: row.org_id, payload: mapped });
    try { require('./riskEngine').evaluateOrg(row.org_id, { sanctionsHit: mapped.sanctionsHit, pepHit: mapped.pepHit, kycStatus: mapped.status }); } catch (_) {}
  }
}

/** Manual compliance decision (review queue). */
async function decide({ verificationId, decision, reviewerId, notes }) {
  const status = decision === 'approve' ? 'approved' : 'rejected';
  const [row] = await db.sequelize.query(
    `UPDATE kyc_verifications SET status = :status, decision = :decision, reviewer_id = :rev, notes = :notes, updated_at = now()
     WHERE id = :id RETURNING org_id`,
    { replacements: { status, decision, rev: reviewerId || null, notes: notes || null, id: verificationId }, type: Q.SELECT },
  ).then((r) => r).catch(() => [null]);
  if (row) {
    await db.organizations.update({ kyc_status: status }, { where: { id: row.org_id } });
    await complianceAudit.log({ domain: 'kyc', action: `manual:${status}`, orgId: row.org_id, actorId: reviewerId, payload: { notes } });
  }
  return { status };
}

async function isApprovedForActivation(orgId) {
  if (process.env.KYC_REQUIRED !== 'true') return true; // opt-in gating
  const [org] = await db.sequelize.query(`SELECT kyc_status FROM organizations WHERE id = :org`, { replacements: { org: orgId }, type: Q.SELECT });
  return org && org.kyc_status === 'approved';
}

module.exports = { start, accessToken, verifyWebhook, handleWebhook, decide, isApprovedForActivation, mapReview, configured };
