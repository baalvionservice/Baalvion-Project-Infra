# @baalvion/email

Centralized **Amazon SES (AWS SDK v3)** email service for the Baalvion platform.

One package owns sending: verified-sender selection, responsive dark-mode templates, transient
retry (never retry hard bounces), delivery logging, and SNS/SES event handling. Plain CommonJS,
no build step — it resolves unchanged in pruned production images.

## Why

The platform previously had **six** divergent mail implementations (Resend, three flavours of
nodemailer, two hand-rolled SMTP clients). This package replaces the transport in all of them with
a single SES path while preserving each caller's existing function signatures.

## Install

It's a workspace package — depend on it with `"@baalvion/email": "workspace:*"`.

## Usage

```js
const { createEmailService, createRedisStore } = require('@baalvion/email');

const email = createEmailService({
  logger,                                   // pino/console-compatible
  store: createRedisStore(redisClient),     // optional durable delivery status
});

await email.sendOTP({ to, code: '123456', expiresMinutes: 5 });
await email.sendVerificationEmail({ to, verifyUrl });
await email.sendPasswordReset({ to, resetUrl });
await email.sendWelcomeEmail({ to, name });
await email.sendSecurityAlert({ to, reason, ip, location });
await email.sendOrderNotification({ to, orderNumber, items, total, currency });
await email.sendInvoice({ to, invoiceNumber, items, total, currency, invoiceUrl });
await email.sendSupportReply({ to, ticketId, agentName, message, ticketUrl });
await email.sendNewsletter({ to, subject, title, bodyHtml, unsubscribeUrl });

// Backward-compatible low-level send for services that render their own HTML:
await email.sendRaw({ to, subject, html, category: 'auth' });
```

### Sender mapping (automatic)

| Category        | Default From                | Used by                                  |
|-----------------|-----------------------------|------------------------------------------|
| `auth`          | noreply@baalvion.com        | OTP, verification, password reset, welcome |
| `notifications` | notifications@baalvion.com  | order confirmations, newsletters         |
| `security`      | security@baalvion.com       | login / security alerts                  |
| `support`       | support@baalvion.com        | support replies                          |
| `billing`       | billing@baalvion.com        | invoices                                 |
| `invrel`        | invrel@baalvion.com         | investor-relations mail                  |

The category is derived from the method/template — callers never choose a raw From address, so
every message leaves a **verified** sender.

## SNS / SES event webhook

```js
const { handleSnsRequest } = require('@baalvion/email');

// POST /webhooks/aws/ses  (mount with a raw-body parser)
const result = await handleSnsRequest({ body: req.rawBody, store, logger });
```

It verifies the SNS signature (RSA-SHA1/256, signing-cert host allowlisted to
`sns.<region>.amazonaws.com` — SSRF-safe), auto-confirms `SubscriptionConfirmation`, and maps
`Bounce / Complaint / Delivery / Reject / DeliveryDelay / Rendering Failure / Send / Subscription`
to a delivery status persisted via the store.

## Environment

```
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...            # or rely on the instance/task IAM role (SES_USE_INSTANCE_ROLE=true)
AWS_SECRET_ACCESS_KEY=...
SES_CONFIGURATION_SET=baalvion-production
SES_FROM_AUTH=noreply@baalvion.com
SES_FROM_NOTIFICATIONS=notifications@baalvion.com
SES_FROM_SECURITY=security@baalvion.com
SES_FROM_SUPPORT=support@baalvion.com
SES_FROM_BILLING=billing@baalvion.com
SES_FROM_INVREL=invrel@baalvion.com
```

Credentials are **only** read from the environment / ambient AWS credential chain — never hard-coded.

## Test

```
npm test          # node --test test/*.test.mjs
```
