'use strict';
const Handlebars = require('handlebars');
const { baseLayout } = require('./base');
const premium = require('./premium');

// Register helpers
Handlebars.registerHelper('formatDate', (d) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '');

// Lifecycle emails (welcome, onboarding, re-engagement, lead notifications) render through the
// premium brand-themed system instead of the generic Handlebars baseLayout — keyed by
// data.brand (a slug from templates/premium/brands.js, e.g. 'baalvion', 'proxy', 'law';
// defaults to 'baalvion' when absent/unrecognised). Every other template is unaffected.
const PREMIUM_RENDERERS = {
    welcome:            (data) => premium.renderWelcome(data.brand, data),
    onboardingDay1:     (data) => premium.renderOnboardingDay(data.brand, 1, data),
    onboardingDay3:     (data) => premium.renderOnboardingDay(data.brand, 3, data),
    onboardingDay7:     (data) => premium.renderOnboardingDay(data.brand, 7, data),
    reengagement:       (data) => premium.renderReengagement(data.brand, data),
    leadNotification:   (data) => premium.renderLeadNotification(data.brand, data),
};

// ── Template bodies ───────────────────────────────────────────────────────────

const TEMPLATES = {
    // NOTE: there is deliberately no plain-layout 'welcome' entry here — 'welcome' is a
    // PREMIUM_RENDERERS key (see above) and render() checks PREMIUM_RENDERERS first, so a
    // generic TEMPLATES.welcome would be unreachable dead code.

    // Email verification resend
    emailVerification: {
        subject: 'Verify your Baalvion email address',
        preview: 'Confirm your email to continue',
        body: baseLayout(`
<h1 class="h1">Verify your email address</h1>
<p class="text">Click the button below to verify <strong>{{email}}</strong>.</p>
<a href="{{verifyUrl}}" class="btn">Verify Email</a>
<p class="text" style="font-size:13px;color:#a1a1aa">This link expires in 24 hours.</p>
`, 'Confirm your email to continue'),
    },

    // Password reset
    passwordReset: {
        subject: 'Reset your Baalvion password',
        preview: 'We received a request to reset your password',
        body: baseLayout(`
<h1 class="h1">Reset your password</h1>
<p class="text">We received a request to reset the password for your Baalvion account. Click the button below to choose a new password.</p>
<a href="{{resetUrl}}" class="btn">Reset Password</a>
<hr class="divider" />
<div class="alert-box">
  <p style="margin:0;font-size:13px;color:#7f1d1d"><strong>Didn't request this?</strong> Your password has not been changed. You can safely ignore this email.</p>
</div>
<p class="text" style="font-size:13px;color:#a1a1aa">This link expires in 1 hour.</p>
`, 'Reset your Baalvion password'),
    },

    // New login alert (sent when high-risk login detected)
    loginAlert: {
        subject: 'New sign-in to your Baalvion account',
        preview: 'We noticed a new sign-in from {{location}}',
        body: baseLayout(`
<h1 class="h1">New sign-in detected</h1>
<p class="text">We noticed a new sign-in to your account. If this was you, no action is needed.</p>
<div style="background:#f4f5f7;border-radius:8px;padding:20px;margin:16px 0">
  <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#09090b">Sign-in details</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Time:</strong> {{formatDate time}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Location:</strong> {{location}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Device:</strong> {{device}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>IP address:</strong> {{ip}}</p>
</div>
<div class="alert-box">
  <p style="margin:0;font-size:13px;color:#7f1d1d">If you don't recognise this sign-in, <a href="{{secureUrl}}" style="color:#991b1b;font-weight:600">secure your account immediately</a>.</p>
</div>
`, 'We noticed a new sign-in to your account'),
    },

    // High-risk login (risk score ≥ 70)
    securityAlert: {
        subject: '[SECURITY] Suspicious sign-in attempt on your account',
        preview: 'Unusual activity detected on your account',
        body: baseLayout(`
<h1 class="h1" style="color:#dc2626">Security alert</h1>
<p class="text">We detected unusual activity on your account and have flagged it for review.</p>
<div class="alert-box">
  <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#7f1d1d">Why are we alerting you?</p>
  <p style="margin:0;font-size:13px;color:#7f1d1d">{{reason}}</p>
</div>
<div style="background:#f4f5f7;border-radius:8px;padding:20px;margin:16px 0">
  <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#09090b">Event details</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Time:</strong> {{formatDate time}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>IP:</strong> {{ip}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Location:</strong> {{location}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Risk score:</strong> {{riskScore}}/100</p>
</div>
<a href="{{secureUrl}}" class="btn btn-danger">Secure My Account</a>
<p class="text" style="font-size:13px;color:#a1a1aa">If you recognise this activity, you can dismiss this alert in your account settings.</p>
`, 'Unusual activity detected on your account'),
    },

    // Org invitation
    orgInvite: {
        subject: '{{inviterName}} invited you to join {{orgName}} on Baalvion',
        preview: 'You have been invited to join {{orgName}}',
        body: baseLayout(`
<h1 class="h1">You've been invited!</h1>
<p class="text"><strong>{{inviterName}}</strong> has invited you to join <strong>{{orgName}}</strong> as a <strong>{{role}}</strong>.</p>
<a href="{{acceptUrl}}" class="btn">Accept Invitation</a>
<p class="text" style="font-size:13px;color:#a1a1aa">This invitation expires in 7 days. If you don't have a Baalvion account, you'll be asked to create one.</p>
`, 'Join {{orgName}} on Baalvion'),
    },

    // MFA enabled confirmation
    mfaEnabled: {
        subject: 'Two-factor authentication enabled on your account',
        preview: 'MFA has been enabled for your account',
        body: baseLayout(`
<h1 class="h1">Two-factor authentication enabled</h1>
<div class="success-box">
  <p style="margin:0;font-size:14px;color:#14532d"><strong>Your account is now more secure.</strong> Two-factor authentication has been enabled.</p>
</div>
<p class="text">You will now be required to enter a verification code from your authenticator app each time you sign in.</p>
<p class="text">If you did not enable this, please <a href="{{secureUrl}}" style="color:#09090b;font-weight:600">secure your account</a> immediately.</p>
`, 'MFA enabled on your account'),
    },

    // Order placed — confirmation (sent on order creation, before payment)
    orderConfirmation: {
        subject: 'Order confirmed: {{orderNumber}}',
        preview: 'We received your order {{orderNumber}}',
        body: baseLayout(`
<h1 class="h1">Thank you{{#if name}}, {{name}}{{/if}}!</h1>
<p class="text">We've received your order <strong>{{orderNumber}}</strong> and it is now being processed. A summary is below.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse">
  <thead>
    <tr>
      <th align="left"  style="padding:8px 0;font-size:12px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.5px">Item</th>
      <th align="center" style="padding:8px 0;font-size:12px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.5px">Qty</th>
      <th align="right" style="padding:8px 0;font-size:12px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.5px">Total</th>
    </tr>
  </thead>
  <tbody>
    {{#each items}}
    <tr>
      <td align="left"  style="padding:10px 0;font-size:14px;color:#09090b;border-bottom:1px solid #f4f4f5">{{this.name}}</td>
      <td align="center" style="padding:10px 0;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5">{{this.quantity}}</td>
      <td align="right" style="padding:10px 0;font-size:14px;color:#09090b;border-bottom:1px solid #f4f4f5">{{this.total}} {{../currency}}</td>
    </tr>
    {{/each}}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2" align="right" style="padding:14px 0 0;font-size:15px;font-weight:700;color:#09090b">Total</td>
      <td align="right" style="padding:14px 0 0;font-size:15px;font-weight:700;color:#09090b">{{total}} {{currency}}</td>
    </tr>
  </tfoot>
</table>
<a href="{{orderUrl}}" class="btn">View Your Order</a>
<p class="text" style="font-size:13px;color:#a1a1aa">You'll receive another email once payment is confirmed.</p>
`, 'We received your order {{orderNumber}}'),
    },

    // Payment captured — order paid (sent when payment is confirmed/captured)
    orderPaid: {
        subject: 'Payment received for {{orderNumber}}',
        preview: 'Your payment for {{orderNumber}} was successful',
        body: baseLayout(`
<h1 class="h1">Payment received{{#if name}}, {{name}}{{/if}}</h1>
<div class="success-box">
  <p style="margin:0;font-size:14px;color:#14532d"><strong>We've received your payment.</strong> Your order <strong>{{orderNumber}}</strong> is now confirmed and being prepared.</p>
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse">
  <thead>
    <tr>
      <th align="left"  style="padding:8px 0;font-size:12px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.5px">Item</th>
      <th align="center" style="padding:8px 0;font-size:12px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.5px">Qty</th>
      <th align="right" style="padding:8px 0;font-size:12px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.5px">Total</th>
    </tr>
  </thead>
  <tbody>
    {{#each items}}
    <tr>
      <td align="left"  style="padding:10px 0;font-size:14px;color:#09090b;border-bottom:1px solid #f4f4f5">{{this.name}}</td>
      <td align="center" style="padding:10px 0;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5">{{this.quantity}}</td>
      <td align="right" style="padding:10px 0;font-size:14px;color:#09090b;border-bottom:1px solid #f4f4f5">{{this.total}} {{../currency}}</td>
    </tr>
    {{/each}}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2" align="right" style="padding:14px 0 0;font-size:15px;font-weight:700;color:#09090b">Total paid</td>
      <td align="right" style="padding:14px 0 0;font-size:15px;font-weight:700;color:#09090b">{{total}} {{currency}}</td>
    </tr>
  </tfoot>
</table>
<a href="{{orderUrl}}" class="btn">View Your Order</a>
<p class="text" style="font-size:13px;color:#a1a1aa">A receipt for this payment is available on your order page.</p>
`, 'Your payment for {{orderNumber}} was successful'),
    },

    // Impersonation notification (sent to admin + target)
    impersonationAlert: {
        subject: '[Admin] Impersonation session started',
        preview: 'An admin has started an impersonation session',
        body: baseLayout(`
<h1 class="h1">Impersonation session started</h1>
<div class="alert-box">
  <p style="margin:0;font-size:13px;color:#7f1d1d">An administrator has started an impersonation session on your account for support purposes.</p>
</div>
<div style="background:#f4f5f7;border-radius:8px;padding:20px;margin:16px 0">
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Admin:</strong> {{adminEmail}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Time:</strong> {{formatDate time}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Expires:</strong> {{formatDate expiresAt}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Session ID:</strong> <code>{{sessionId}}</code></p>
</div>
<p class="text" style="font-size:13px;color:#a1a1aa">If you have concerns, contact support immediately.</p>
`, 'An admin started an impersonation session'),
    },

    // Payment attempt failed (order/checkout)
    paymentFailed: {
        subject: 'Payment failed for {{orderNumber}}',
        preview: 'We were unable to process your payment for {{orderNumber}}',
        body: baseLayout(`
<h1 class="h1">We couldn't process your payment</h1>
<div class="alert-box">
  <p style="margin:0;font-size:14px;color:#7f1d1d"><strong>Your payment for order {{orderNumber}} did not go through.</strong>{{#if reason}} {{reason}}{{/if}}</p>
</div>
<div style="background:#f4f5f7;border-radius:8px;padding:20px;margin:16px 0">
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Order:</strong> {{orderNumber}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Amount:</strong> {{amount}} {{currency}}</p>
</div>
<a href="{{retryUrl}}" class="btn">Try Payment Again</a>
<p class="text" style="font-size:13px;color:#a1a1aa">Your order is on hold until payment is completed. No charge has been made.</p>
`, 'We were unable to process your payment'),
    },

    // Refund processed
    paymentRefunded: {
        subject: 'Refund processed for {{orderNumber}}',
        preview: 'Your refund for {{orderNumber}} has been processed',
        body: baseLayout(`
<h1 class="h1">Your refund has been processed</h1>
<div class="success-box">
  <p style="margin:0;font-size:14px;color:#14532d"><strong>{{amount}} {{currency}}</strong> has been refunded for order <strong>{{orderNumber}}</strong>.</p>
</div>
<div style="background:#f4f5f7;border-radius:8px;padding:20px;margin:16px 0">
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Order:</strong> {{orderNumber}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Refund amount:</strong> {{amount}} {{currency}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Processed:</strong> {{formatDate processedAt}}</p>
</div>
<a href="{{orderUrl}}" class="btn">View Order</a>
<p class="text" style="font-size:13px;color:#a1a1aa">Refunds typically appear on your original payment method within 5-10 business days.</p>
`, 'Your refund has been processed'),
    },

    // Upcoming payment due (checklist: "Payment Reminders")
    paymentReminder: {
        subject: 'Payment due soon for {{orderNumber}}',
        preview: 'Your payment of {{amount}} {{currency}} is due {{formatDate dueDate}}',
        body: baseLayout(`
<h1 class="h1">A payment is coming up</h1>
<p class="text">This is a reminder that a payment for <strong>{{orderNumber}}</strong> is due soon.</p>
<div style="background:#f4f5f7;border-radius:8px;padding:20px;margin:16px 0">
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Amount due:</strong> {{amount}} {{currency}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Due date:</strong> {{formatDate dueDate}}</p>
</div>
<a href="{{payUrl}}" class="btn">Pay Now</a>
<p class="text" style="font-size:13px;color:#a1a1aa">If you've already paid, please disregard this reminder.</p>
`, 'A payment is coming up'),
    },

    // Invoice — reuses the exact same items-table markup as orderConfirmation/orderPaid
    invoice: {
        subject: 'Your invoice {{invoiceNumber}}',
        preview: 'Invoice {{invoiceNumber}} for {{total}} {{currency}}',
        body: baseLayout(`
<h1 class="h1">Invoice {{invoiceNumber}}</h1>
<p class="text">{{#if issuedTo}}Billed to {{issuedTo}}. {{/if}}Here is a summary of your invoice.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse">
  <thead>
    <tr>
      <th align="left"  style="padding:8px 0;font-size:12px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.5px">Item</th>
      <th align="center" style="padding:8px 0;font-size:12px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.5px">Qty</th>
      <th align="right" style="padding:8px 0;font-size:12px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.5px">Total</th>
    </tr>
  </thead>
  <tbody>
    {{#each items}}
    <tr>
      <td align="left"  style="padding:10px 0;font-size:14px;color:#09090b;border-bottom:1px solid #f4f4f5">{{this.name}}</td>
      <td align="center" style="padding:10px 0;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5">{{this.quantity}}</td>
      <td align="right" style="padding:10px 0;font-size:14px;color:#09090b;border-bottom:1px solid #f4f4f5">{{this.total}} {{../currency}}</td>
    </tr>
    {{/each}}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2" align="right" style="padding:14px 0 0;font-size:15px;font-weight:700;color:#09090b">Total</td>
      <td align="right" style="padding:14px 0 0;font-size:15px;font-weight:700;color:#09090b">{{total}} {{currency}}</td>
    </tr>
  </tfoot>
</table>
<a href="{{invoiceUrl}}" class="btn">View Invoice</a>
<p class="text" style="font-size:13px;color:#a1a1aa">{{#if dueDate}}Payment due {{formatDate dueDate}}.{{/if}}</p>
`, 'Invoice {{invoiceNumber}}'),
    },

    // Subscription renewed successfully
    subscriptionRenewal: {
        subject: 'Your {{planName}} subscription has renewed',
        preview: 'Your subscription renewed for {{amount}} {{currency}}',
        body: baseLayout(`
<h1 class="h1">Subscription renewed</h1>
<div class="success-box">
  <p style="margin:0;font-size:14px;color:#14532d">Your <strong>{{planName}}</strong> subscription has renewed for <strong>{{amount}} {{currency}}</strong>.</p>
</div>
<div style="background:#f4f5f7;border-radius:8px;padding:20px;margin:16px 0">
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Plan:</strong> {{planName}}</p>
  <p style="margin:4px 0;font-size:13px;color:#52525b"><strong>Next renewal:</strong> {{formatDate nextRenewalDate}}</p>
</div>
<a href="{{manageUrl}}" class="btn">Manage Subscription</a>
`, 'Your subscription renewed'),
    },

    // Subscription expiring soon OR already expired (data.expired: boolean)
    subscriptionExpiry: {
        subject: '{{#if expired}}Your {{planName}} subscription has expired{{else}}Your {{planName}} subscription is expiring soon{{/if}}',
        preview: 'Your {{planName}} subscription needs attention',
        body: baseLayout(`
<h1 class="h1">{{#if expired}}Your subscription has expired{{else}}Your subscription is expiring soon{{/if}}</h1>
<div class="alert-box">
  <p style="margin:0;font-size:14px;color:#7f1d1d">{{#if expired}}Your <strong>{{planName}}</strong> subscription expired on {{formatDate expiresAt}}.{{else}}Your <strong>{{planName}}</strong> subscription expires on {{formatDate expiresAt}}.{{/if}}</p>
</div>
<a href="{{renewUrl}}" class="btn">{{#if expired}}Reactivate Subscription{{else}}Renew Now{{/if}}</a>
<p class="text" style="font-size:13px;color:#a1a1aa">{{#unless expired}}Renew before the expiry date to avoid any interruption to your access.{{/unless}}</p>
`, 'Your subscription needs attention'),
    },
};

// ── Compile all templates ─────────────────────────────────────────────────────

const compiled = {};
for (const [name, tmpl] of Object.entries(TEMPLATES)) {
    compiled[name] = {
        subject: Handlebars.compile(tmpl.subject),
        preview: Handlebars.compile(tmpl.preview),
        html:    Handlebars.compile(tmpl.body),
    };
}

function render(templateName, data) {
    if (PREMIUM_RENDERERS[templateName]) return PREMIUM_RENDERERS[templateName](data || {});

    const tmpl = compiled[templateName];
    if (!tmpl) throw new Error(`Unknown template: ${templateName}`);
    return {
        subject: tmpl.subject(data),
        html:    tmpl.html(data),
    };
}

module.exports = { render, TEMPLATE_NAMES: [...Object.keys(TEMPLATES), ...Object.keys(PREMIUM_RENDERERS)] };
