'use strict';

/**
 * Multi-channel alerting: in-app notification (always) + optional email, generic
 * webhook, Slack and Discord. Channels are configured per-env; missing config
 * simply skips that channel. All sends are best-effort and never throw to the
 * caller (alerting must not break billing/metering).
 */

const store = require('./platformStore');
const logger = require('./logger');

let emailService = null;
try { emailService = require('../utils/emailService'); } catch (_) { emailService = null; }

const WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL || '';
const SLACK_URL = process.env.ALERT_SLACK_WEBHOOK_URL || '';
const DISCORD_URL = process.env.ALERT_DISCORD_WEBHOOK_URL || '';

async function post(url, body) {
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    logger.error('[alert] webhook post failed:', err.message);
  }
}

/**
 * Fan out an alert to all configured channels + persist an in-app notification.
 * @param {object} a { orgId, severity, title, message, type }
 */
async function dispatch(a) {
  const title = a.title || 'Baalvion alert';
  const message = a.message || '';

  // In-app notification (persisted, shown in dashboard).
  if (a.orgId) {
    try {
      await store.createNotification({ orgId: a.orgId, title, body: message, read: false, createdAt: new Date().toISOString() });
    } catch (err) {
      logger.error('[alert] notification persist failed:', err.message);
    }
  }

  await post(WEBHOOK_URL, { severity: a.severity, type: a.type, orgId: a.orgId, title, message, ts: Date.now() });
  await post(SLACK_URL, { text: `*[${a.severity || 'info'}] ${title}*\n${message}` });
  await post(DISCORD_URL, { content: `**[${a.severity || 'info'}] ${title}**\n${message}` });

  if (emailService && a.email) {
    try { await emailService.send({ to: a.email, subject: title, text: message }); } catch (_) {}
  }
}

// ── Typed helpers ──
function quotaAlert(orgId, level, pct) {
  const pctStr = `${Math.round((pct || 0) * 100)}%`;
  const blocked = level === 'blocked';
  return dispatch({
    orgId,
    type: 'quota',
    severity: blocked ? 'critical' : 'warning',
    title: blocked ? 'Bandwidth quota exhausted' : `Bandwidth usage at ${level}%`,
    message: blocked
      ? 'Your organization has reached its hard bandwidth ceiling. Proxy traffic is paused until you upgrade or add credit.'
      : `Your organization has used ${pctStr} of its bandwidth allowance.`,
  });
}

function paymentFailedAlert(orgId, invoiceId, attempt) {
  return dispatch({
    orgId, type: 'billing', severity: 'critical',
    title: 'Payment failed',
    message: `Payment for invoice ${invoiceId} failed (attempt ${attempt}). Please update your payment method to avoid suspension.`,
  });
}

function abuseAlert(orgId, reason, detail) {
  return dispatch({
    orgId, type: 'abuse', severity: 'critical',
    title: 'Suspicious activity detected',
    message: `${reason}: ${detail}`,
  });
}

function providerOutageAlert(provider, detail) {
  return dispatch({
    type: 'provider', severity: 'critical',
    title: `Provider outage: ${provider}`,
    message: detail,
  });
}

module.exports = { dispatch, quotaAlert, paymentFailedAlert, abuseAlert, providerOutageAlert };
