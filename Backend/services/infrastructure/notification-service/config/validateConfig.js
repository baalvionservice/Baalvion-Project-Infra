'use strict';
const config = require('./appConfig');
const logger = require('../utils/logger');

/**
 * Fail-closed startup validation for the notification-service.
 *
 * This service is the platform's DEDICATED mailer. Without a configured provider it silently
 * falls back to the dev "log" provider — emails appear "sent" in logs but never leave the box.
 * In production that is a silent failure of password resets, invitations, receipts, etc. So in
 * production we REFUSE TO BOOT unless a real email provider is configured.
 *
 * AWS SES is supported via SMTP: set SMTP_HOST=email-smtp.<region>.amazonaws.com with the SES
 * SMTP username/password (NOT the IAM access keys) in SMTP_USER / SMTP_PASS.
 */
function validateConfig() {
  const isProd = config.nodeEnv === 'production';
  const problems = [];

  let hasSes = false;
  try { hasSes = require('../service/sesMailer').isSesEnabled(); } catch { hasSes = false; }
  const hasResend = !!config.email.resendApiKey;
  const hasSmtp = !!(config.email.smtp.host && config.email.smtp.user && config.email.smtp.pass);

  if (isProd && !hasSes && !hasResend && !hasSmtp) {
    problems.push(
      'No email provider configured. Preferred: Amazon SES — set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY ' +
      '(+ AWS_REGION, SES_CONFIGURATION_SET). Alternatives: RESEND_API_KEY, or SMTP_HOST + SMTP_USER + SMTP_PASS.',
    );
  }

  if (problems.length) {
    for (const p of problems) {
      logger.error({ problem: p }, '[notification-service] fail-closed startup check failed');
      // Also write to stderr in case the structured logger has not flushed before exit.
      console.error(`[notification-service] CONFIG ERROR: ${p}`);
    }
    process.exit(1);
  }

  logger.info(
    {
      email: hasSes ? 'ses' : hasResend ? 'resend' : hasSmtp ? 'smtp' : 'log(dev)',
      env: config.nodeEnv,
    },
    '[notification-service] startup config validated',
  );
}

module.exports = { validateConfig };
