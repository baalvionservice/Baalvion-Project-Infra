'use strict';
const Handlebars = require('handlebars');
const { baseLayout } = require('./base');

// Register helpers
Handlebars.registerHelper('formatDate', (d) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '');

// ── Template bodies ───────────────────────────────────────────────────────────

const TEMPLATES = {
    // User registers or is invited
    welcome: {
        subject: 'Welcome to Baalvion, {{name}}!',
        preview: 'Your account is ready',
        body: baseLayout(`
<h1 class="h1">Welcome to Baalvion, {{name}}!</h1>
<p class="text">Your account has been created. Verify your email to unlock all features.</p>
<a href="{{verifyUrl}}" class="btn">Verify Email Address</a>
<p class="text" style="font-size:13px;color:#a1a1aa">This link expires in 24 hours. If you didn't create this account, please ignore this email.</p>
`, 'Your account is ready — verify your email'),
    },

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
    const tmpl = compiled[templateName];
    if (!tmpl) throw new Error(`Unknown template: ${templateName}`);
    return {
        subject: tmpl.subject(data),
        html:    tmpl.html(data),
    };
}

module.exports = { render, TEMPLATE_NAMES: Object.keys(TEMPLATES) };
