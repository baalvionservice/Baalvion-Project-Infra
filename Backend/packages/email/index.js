'use strict';

/**
 * @baalvion/email — centralized Amazon SES (AWS SDK v3) email service.
 *
 *   const { createEmailService } = require('@baalvion/email');
 *   const email = createEmailService({ logger, store });
 *   await email.sendOTP({ to: 'user@x.com', code: '123456', expiresMinutes: 5 });
 *
 * SNS/SES event webhook:
 *   const { handleSnsRequest } = require('@baalvion/email');
 *   await handleSnsRequest({ body: req.rawBody, store, logger });
 */

const { EmailService, createEmailService } = require('./src/EmailService');
const { loadConfig, isSesConfigured } = require('./src/config');
const { createSesClient } = require('./src/client');
const { resolveSender, replyToFor, CATEGORIES } = require('./src/senders');
const { withRetry, isTransient } = require('./src/retry');
const { NoopStore, createRedisStore } = require('./src/stores');
const { htmlToText } = require('./src/text');
const templates = require('./src/templates');
const sns = require('./src/sns');

module.exports = {
    // Service
    EmailService,
    createEmailService,
    // Config
    loadConfig,
    isSesConfigured,
    createSesClient,
    // Senders
    resolveSender,
    replyToFor,
    CATEGORIES,
    // Text
    htmlToText,
    // Retry
    withRetry,
    isTransient,
    // Stores
    NoopStore,
    createRedisStore,
    // Templates
    renderTemplate: templates.render,
    TEMPLATE_NAMES: templates.TEMPLATE_NAMES,
    templates,
    // SNS / SES events
    handleSnsRequest: sns.handleSnsRequest,
    verifySnsSignature: sns.verifySnsSignature,
    parseSesEvent: sns.parseSesEvent,
    sns,
};
