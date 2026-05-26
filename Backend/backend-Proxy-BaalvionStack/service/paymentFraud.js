'use strict';

/**
 * Payment fraud heuristics (Stripe-Radar-style). assess() is a PURE function so
 * it's unit-testable; evaluate() pulls live signals and feeds the risk engine.
 *
 * Signals: failed-payment velocity, geo/payment-country mismatch, rapid card
 * cycling, new-account high-value subscription, disposable email.
 */

const db = require('../models');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

/**
 * @param {object} s
 * @returns {{score:number, decision:'allow'|'review'|'block', reasons:string[]}}
 */
function assess(s = {}) {
  let score = 0;
  const reasons = [];
  const add = (p, why) => { score += p; reasons.push(why); };

  if ((s.failedPayments24h || 0) >= 3) add(35, 'failed_payment_velocity');
  if ((s.distinctCards24h || 0) >= 3) add(30, 'card_cycling');
  if (s.binCountry && s.ipCountry && s.binCountry !== s.ipCountry) add(25, 'geo_payment_mismatch');
  if (s.accountAgeHours != null && s.accountAgeHours < 1 && (s.amount || 0) > 200) add(25, 'new_account_high_value');
  if (s.disposableEmail) add(15, 'disposable_email');
  if (s.chargebacksLifetime && s.chargebacksLifetime > 0) add(40, 'prior_chargeback');

  score = Math.min(100, score);
  const decision = score >= 70 ? 'block' : score >= 40 ? 'review' : 'allow';
  return { score, decision, reasons };
}

async function evaluate({ orgId, amount = 0, binCountry = null, ipCountry = null }) {
  const grab = async (sql) => { const r = await db.sequelize.query(sql, { replacements: { org: orgId }, type: Q.SELECT }).catch(() => [{}]); return r[0] || {}; };
  const failed = await grab(`SELECT COUNT(*) AS n FROM transactions WHERE org_id=:org AND status='failed' AND "createdAt" > now() - interval '24 hours'`);
  const cards = await grab(`SELECT COUNT(DISTINCT gateway_order_id) AS n FROM transactions WHERE org_id=:org AND "createdAt" > now() - interval '24 hours'`);
  const cb = await grab(`SELECT COUNT(*) AS n FROM chargebacks c JOIN transactions t ON t.id=c.transaction_id WHERE t.org_id=:org`);
  const org = await grab(`SELECT EXTRACT(EPOCH FROM (now()-"createdAt"))/3600 AS h FROM organizations WHERE id=:org`);

  const result = assess({
    failedPayments24h: Number(failed.n) || 0,
    distinctCards24h: Number(cards.n) || 0,
    chargebacksLifetime: Number(cb.n) || 0,
    accountAgeHours: org.h != null ? Number(org.h) : null,
    amount, binCountry, ipCountry,
  });

  if (result.decision !== 'allow') {
    try {
      await require('./riskEngine').evaluateOrg(orgId, {
        failedPaymentVelocity: Number(failed.n) || 0,
        geoPaymentMismatch: binCountry && ipCountry && binCountry !== ipCountry,
      });
    } catch (err) { logger.error('[payfraud] risk eval failed:', err.message); }
  }
  return result;
}

module.exports = { assess, evaluate };
