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

  const hasResend = !!config.email.resendApiKey;
  const hasSmtp = !!(config.email.smtp.host && config.email.smtp.user && config.email.smtp.pass);

  if (isProd && !hasResend && !hasSmtp) {
    problems.push(
      'No email provider configured. Set RESEND_API_KEY, or SMTP_HOST + SMTP_USER + SMTP_PASS. ' +
      'For AWS SES use SMTP_HOST=email-smtp.<region>.amazonaws.com with SES SMTP credentials.',
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
      email: hasResend ? 'resend' : hasSmtp ? 'smtp' : 'log(dev)',
      env: config.nodeEnv,
    },
    '[notification-service] startup config validated',
  );
}

module.exports = { validateConfig };
