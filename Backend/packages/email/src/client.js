'use strict';

/**
 * Thin wrapper over the AWS SDK v3 SESv2 client (@aws-sdk/client-sesv2).
 *
 * SESv2 is the current, non-deprecated SES API. `SendEmailCommand` maps to the
 * `ses:SendEmail` IAM action; sending raw MIME (for attachments) maps to `ses:SendRawEmail`.
 * Both actions are granted to the `baalvion-ses-smtp` IAM user, so no AWS-side change is needed.
 */
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

/**
 * Create a configured SESv2 client. Credentials are only passed explicitly when present;
 * otherwise the SDK resolves them from the ambient AWS credential chain (instance/task role).
 *
 * @param {import('./config').EmailConfig} config
 * @returns {SESv2Client}
 */
function createSesClient(config) {
    /** @type {import('@aws-sdk/client-sesv2').SESv2ClientConfig} */
    const clientConfig = { region: config.region };

    if (config.accessKeyId && config.secretAccessKey) {
        clientConfig.credentials = {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            ...(config.sessionToken ? { sessionToken: config.sessionToken } : {}),
        };
    }
    return new SESv2Client(clientConfig);
}

/**
 * Build the SESv2 SendEmailCommand input for a "simple" (HTML + text) message.
 *
 * @param {Object} params
 * @param {string} params.from        Fully-formed From header, e.g. "Baalvion <noreply@baalvion.com>"
 * @param {string|string[]} params.to
 * @param {string} params.subject
 * @param {string} params.html
 * @param {string} [params.text]
 * @param {string} [params.replyTo]
 * @param {string} [params.configurationSet]
 * @param {Array<{name:string,value:string}>} [params.tags]  SES message tags (appear on SNS events)
 * @param {Array<{name:string,value:string}>} [params.headers]  Custom MIME headers (e.g. List-Unsubscribe)
 * @returns {SendEmailCommand}
 */
function buildSendCommand({ from, to, subject, html, text, replyTo, configurationSet, tags, headers }) {
    const destinations = Array.isArray(to) ? to : [to];
    return new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: destinations },
        ...(replyTo ? { ReplyToAddresses: [replyTo] } : {}),
        ...(configurationSet ? { ConfigurationSetName: configurationSet } : {}),
        ...(tags && tags.length
            ? { EmailTags: tags.map((t) => ({ Name: sanitizeTag(t.name), Value: sanitizeTag(t.value) })) }
            : {}),
        Content: {
            Simple: {
                Subject: { Data: subject, Charset: 'UTF-8' },
                Body: {
                    Html: { Data: html, Charset: 'UTF-8' },
                    ...(text ? { Text: { Data: text, Charset: 'UTF-8' } } : {}),
                },
                // SESv2 Simple content supports custom headers (SDK >= 3.679). We only ever set
                // List-Unsubscribe here, and only for marketing mail — never transactional.
                ...(headers && headers.length
                    ? { Headers: headers.map((h) => ({ Name: h.name, Value: h.value })) }
                    : {}),
            },
        },
    });
}

// SES message-tag names/values only accept [A-Za-z0-9_-]. Coerce anything else so a
// stray character in a template name can never make the whole send fail.
function sanitizeTag(value) {
    return String(value).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 256);
}

module.exports = { createSesClient, buildSendCommand, SendEmailCommand, sanitizeTag };
