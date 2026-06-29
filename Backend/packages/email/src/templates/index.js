'use strict';

/**
 * Reusable, responsive, dark-mode-aware email templates.
 *
 * Each template is a pure function: (data, ctx) => { subject, html, text }.
 *  - `ctx` carries shared values injected by EmailService (appUrl, supportEmail).
 *  - Every interpolated value is HTML-escaped via `e()` to prevent injection.
 *  - A plain-text alternative is generated for each (improves deliverability + a11y).
 *
 * `category` declares which sender bucket the template belongs to so the EmailService
 * can pick the correct verified From address automatically.
 */

const { baseLayout, escapeHtml: e } = require('./base');

const btn = (href, label, danger = false) =>
    `<a href="${e(href)}" class="btn${danger ? ' btn-danger' : ''}" style="display:inline-block;background:${danger ? '#dc2626' : '#09090b'};color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:8px;font-size:15px;font-weight:600;margin:18px 0;">${e(label)}</a>`;

const kv = (label, value) =>
    `<p class="kv" style="font-size:13px;margin:5px 0;"><strong>${e(label)}:</strong> ${e(value)}</p>`;

/** Format a date defensively (accepts Date | ISO string | epoch). */
const fmtDate = (d) => {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
};

// ── Templates ─────────────────────────────────────────────────────────────────

const TEMPLATES = {
    // 1. One-time passcode (login / verification code)
    otp: {
        category: 'auth',
        render: (d, ctx) => ({
            subject: `${d.code} is your Baalvion verification code`,
            preview: 'Your one-time verification code',
            text: `Your Baalvion verification code is ${d.code}. It expires in ${d.expiresMinutes || 5} minutes. If you did not request this, ignore this email.`,
            body: `
<h1 class="h1">Your verification code</h1>
<p class="text">Use the code below to ${e(d.purpose || 'continue signing in')}. It expires in <strong>${e(d.expiresMinutes || 5)} minutes</strong>.</p>
<div class="code-box">${e(d.code)}</div>
<p class="muted">For your security, never share this code with anyone — Baalvion staff will never ask for it.</p>`,
        }),
    },

    // 2. Email verification (link)
    emailVerification: {
        category: 'auth',
        render: (d, ctx) => ({
            subject: 'Verify your Baalvion email address',
            preview: 'Confirm your email to continue',
            text: `Verify your email (${d.email || ''}): ${d.verifyUrl}\nThis link expires in 24 hours.`,
            body: `
<h1 class="h1">Verify your email address</h1>
<p class="text">Confirm <strong>${e(d.email || 'your email')}</strong> to activate your Baalvion account.</p>
${btn(d.verifyUrl, 'Verify Email Address')}
<p class="muted">Or paste this link into your browser:<br /><a href="${e(d.verifyUrl)}" style="color:#6b7280;word-break:break-all">${e(d.verifyUrl)}</a></p>
<p class="muted">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>`,
        }),
    },

    // 3. Welcome
    welcome: {
        category: 'auth',
        render: (d, ctx) => ({
            subject: `Welcome to Baalvion${d.name ? `, ${d.name}` : ''}!`,
            preview: 'Your account is ready',
            text: `Welcome to Baalvion${d.name ? `, ${d.name}` : ''}! Get started: ${d.ctaUrl || ctx.appUrl}`,
            body: `
<h1 class="h1">Welcome to Baalvion${d.name ? `, ${e(d.name)}` : ''}!</h1>
<p class="text">Your account is ready. You now have access to the Baalvion platform — manage your profile, security, and everything in one place.</p>
${btn(d.ctaUrl || ctx.appUrl, 'Get Started')}
<p class="muted">Need a hand? Reach us any time at <a href="mailto:${e(ctx.supportEmail)}" style="color:#6b7280">${e(ctx.supportEmail)}</a>.</p>`,
        }),
    },

    // 4. Password reset
    passwordReset: {
        category: 'auth',
        render: (d, ctx) => ({
            subject: 'Reset your Baalvion password',
            preview: 'We received a request to reset your password',
            text: `Reset your Baalvion password: ${d.resetUrl}\nThis link expires in ${d.expiresMinutes || 60} minutes. If you didn't request this, ignore this email — your password is unchanged.`,
            body: `
<h1 class="h1">Reset your password</h1>
<p class="text">We received a request to reset the password for your Baalvion account. Click below to choose a new one.</p>
${btn(d.resetUrl, 'Reset Password')}
<div class="alert-box" style="border-left:4px solid #ef4444;background:#fef2f2;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;color:#7f1d1d;">
  <strong>Didn't request this?</strong> Your password has not been changed. You can safely ignore this email.
</div>
<p class="muted">This link expires in ${e(d.expiresMinutes || 60)} minutes.</p>`,
        }),
    },

    // 5. Login alert (informational new sign-in)
    loginAlert: {
        category: 'security',
        render: (d, ctx) => ({
            subject: 'New sign-in to your Baalvion account',
            preview: `New sign-in${d.location ? ` from ${d.location}` : ''}`,
            text: `New sign-in to your Baalvion account.\nTime: ${fmtDate(d.time)}\nLocation: ${d.location || 'Unknown'}\nDevice: ${d.device || 'Unknown'}\nIP: ${d.ip || 'Unknown'}\nIf this wasn't you: ${d.secureUrl || ctx.appUrl}`,
            body: `
<h1 class="h1">New sign-in detected</h1>
<p class="text">We noticed a new sign-in to your account. If this was you, no action is needed.</p>
<div class="panel" style="background:#f4f5f7;border-radius:10px;padding:20px;margin:16px 0;">
  ${kv('Time', fmtDate(d.time))}
  ${kv('Location', d.location || 'Unknown')}
  ${kv('Device', d.device || 'Unknown')}
  ${kv('IP address', d.ip || 'Unknown')}
</div>
<div class="alert-box" style="border-left:4px solid #ef4444;background:#fef2f2;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;color:#7f1d1d;">
  Don't recognise this? <a href="${e(d.secureUrl || ctx.appUrl)}" style="color:#991b1b;font-weight:600">Secure your account immediately</a>.
</div>`,
        }),
    },

    // 6. Security alert (high-risk / suspicious)
    securityAlert: {
        category: 'security',
        render: (d, ctx) => ({
            subject: '[Security] Unusual activity on your Baalvion account',
            preview: 'Unusual activity detected on your account',
            text: `Security alert: ${d.reason || 'Unusual activity was detected on your account.'}\nTime: ${fmtDate(d.time)}\nIP: ${d.ip || 'Unknown'}\nLocation: ${d.location || 'Unknown'}\nSecure your account: ${d.secureUrl || ctx.appUrl}`,
            body: `
<h1 class="h1" style="color:#dc2626">Security alert</h1>
<p class="text">We detected activity that looks unusual for your account and flagged it for your review.</p>
<div class="alert-box" style="border-left:4px solid #ef4444;background:#fef2f2;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;color:#7f1d1d;">
  <strong>What happened:</strong> ${e(d.reason || 'A high-risk sign-in or change was detected.')}
</div>
<div class="panel" style="background:#f4f5f7;border-radius:10px;padding:20px;margin:16px 0;">
  ${kv('Time', fmtDate(d.time))}
  ${kv('IP address', d.ip || 'Unknown')}
  ${kv('Location', d.location || 'Unknown')}
  ${d.riskScore != null ? kv('Risk score', `${d.riskScore}/100`) : ''}
</div>
${btn(d.secureUrl || ctx.appUrl, 'Secure My Account', true)}
<p class="muted">If you recognise this activity, no action is needed.</p>`,
        }),
    },

    // 7. Order confirmation
    orderConfirmation: {
        category: 'notifications',
        render: (d, ctx) => {
            const items = Array.isArray(d.items) ? d.items : [];
            const rows = items.map((it) => `
    <tr>
      <td class="ln-td" style="padding:11px 0;font-size:14px;border-bottom:1px solid #f4f4f5;">${e(it.name)}</td>
      <td class="ln-td" align="center" style="padding:11px 0;font-size:14px;border-bottom:1px solid #f4f4f5;">${e(it.quantity)}</td>
      <td class="ln-td" align="right" style="padding:11px 0;font-size:14px;border-bottom:1px solid #f4f4f5;">${e(it.total)} ${e(d.currency || '')}</td>
    </tr>`).join('');
            return {
                subject: `Order confirmed: ${d.orderNumber}`,
                preview: `We received your order ${d.orderNumber}`,
                text: `Thank you${d.name ? `, ${d.name}` : ''}! Order ${d.orderNumber} confirmed. Total: ${d.total} ${d.currency || ''}. View: ${d.orderUrl || ctx.appUrl}`,
                body: `
<h1 class="h1">Thank you${d.name ? `, ${e(d.name)}` : ''}!</h1>
<p class="text">We've received your order <strong>${e(d.orderNumber)}</strong> and it's now being processed.</p>
<table class="ln-table" role="presentation" width="100%" style="width:100%;border-collapse:collapse;margin:16px 0;">
  <thead><tr>
    <th class="ln-th" style="padding:8px 0;font-size:11px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.6px;text-align:left;">Item</th>
    <th class="ln-th" align="center" style="padding:8px 0;font-size:11px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.6px;">Qty</th>
    <th class="ln-th" align="right" style="padding:8px 0;font-size:11px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.6px;">Total</th>
  </tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr>
    <td colspan="2" align="right" class="ln-total" style="padding:14px 0 0;font-size:16px;font-weight:700;">Total</td>
    <td align="right" class="ln-total" style="padding:14px 0 0;font-size:16px;font-weight:700;">${e(d.total)} ${e(d.currency || '')}</td>
  </tr></tfoot>
</table>
${btn(d.orderUrl || ctx.appUrl, 'View Your Order')}`,
            };
        },
    },

    // 8. Invoice
    invoice: {
        category: 'billing',
        render: (d, ctx) => {
            const items = Array.isArray(d.items) ? d.items : [];
            const rows = items.map((it) => `
    <tr>
      <td class="ln-td" style="padding:11px 0;font-size:14px;border-bottom:1px solid #f4f4f5;">${e(it.description || it.name)}</td>
      <td class="ln-td" align="right" style="padding:11px 0;font-size:14px;border-bottom:1px solid #f4f4f5;">${e(it.amount)} ${e(d.currency || '')}</td>
    </tr>`).join('');
            return {
                subject: `Invoice ${d.invoiceNumber} from Baalvion`,
                preview: `Invoice ${d.invoiceNumber} — ${d.total} ${d.currency || ''}`,
                text: `Invoice ${d.invoiceNumber}\nIssued: ${fmtDate(d.issuedAt)}\nDue: ${fmtDate(d.dueAt)}\nTotal: ${d.total} ${d.currency || ''}\nView/pay: ${d.invoiceUrl || ctx.appUrl}`,
                body: `
<h1 class="h1">Invoice ${e(d.invoiceNumber)}</h1>
<p class="text">${d.name ? `Hi ${e(d.name)}, h` : 'H'}ere is your invoice from Baalvion.</p>
<div class="panel" style="background:#f4f5f7;border-radius:10px;padding:20px;margin:16px 0;">
  ${kv('Invoice number', d.invoiceNumber)}
  ${d.issuedAt ? kv('Issued', fmtDate(d.issuedAt)) : ''}
  ${d.dueAt ? kv('Due', fmtDate(d.dueAt)) : ''}
  ${d.status ? kv('Status', d.status) : ''}
</div>
<table class="ln-table" role="presentation" width="100%" style="width:100%;border-collapse:collapse;margin:16px 0;">
  <thead><tr>
    <th class="ln-th" style="padding:8px 0;font-size:11px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.6px;text-align:left;">Description</th>
    <th class="ln-th" align="right" style="padding:8px 0;font-size:11px;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:0.6px;">Amount</th>
  </tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr>
    <td align="right" class="ln-total" style="padding:14px 0 0;font-size:16px;font-weight:700;">Total</td>
    <td align="right" class="ln-total" style="padding:14px 0 0;font-size:16px;font-weight:700;">${e(d.total)} ${e(d.currency || '')}</td>
  </tr></tfoot>
</table>
${d.invoiceUrl ? btn(d.invoiceUrl, 'View & Pay Invoice') : ''}
<p class="muted">Questions about this invoice? Contact <a href="mailto:${e(ctx.billingEmail)}" style="color:#6b7280">${e(ctx.billingEmail)}</a>.</p>`,
            };
        },
    },

    // 9. Support reply
    supportReply: {
        category: 'support',
        render: (d, ctx) => ({
            subject: d.ticketId ? `Re: [#${d.ticketId}] ${d.subject || 'Your support request'}` : `Re: ${d.subject || 'Your support request'}`,
            preview: 'A reply from the Baalvion support team',
            text: `${d.agentName || 'Baalvion Support'} replied${d.ticketId ? ` to ticket #${d.ticketId}` : ''}:\n\n${(d.message || '').replace(/<[^>]+>/g, '')}\n\n${d.ticketUrl ? `View the conversation: ${d.ticketUrl}` : ''}`,
            body: `
<h1 class="h1">${d.ticketId ? `Re: ticket #${e(d.ticketId)}` : 'A reply from support'}</h1>
<p class="text">${e(d.agentName || 'The Baalvion support team')} replied to your request:</p>
<div class="panel" style="background:#f4f5f7;border-radius:10px;padding:20px;margin:16px 0;">
  <div class="text" style="margin:0;">${d.messageHtml || e(d.message || '').replace(/\n/g, '<br />')}</div>
</div>
${d.ticketUrl ? btn(d.ticketUrl, 'View Conversation') : ''}
<p class="muted">Reply to this email to continue the conversation${d.ticketId ? ` (ticket #${e(d.ticketId)})` : ''}.</p>`,
        }),
    },

    // 10. Newsletter (the ONLY marketing template — gets a List-Unsubscribe header)
    newsletter: {
        category: 'notifications',
        marketing: true,
        render: (d, ctx) => ({
            subject: d.subject || 'Baalvion Newsletter',
            preview: d.preview || d.subject || 'News and updates from Baalvion',
            text: `${d.title || 'Baalvion Newsletter'}\n\n${(d.bodyText || (d.bodyHtml || '').replace(/<[^>]+>/g, ''))}\n\nUnsubscribe: ${d.unsubscribeUrl || ''}`,
            footerNote: d.unsubscribeUrl
                ? `You're receiving this newsletter because you subscribed at Baalvion. <a href="${e(d.unsubscribeUrl)}" style="color:#71717a">Unsubscribe</a>.`
                : '',
            body: `
${d.title ? `<h1 class="h1">${e(d.title)}</h1>` : ''}
<div class="text" style="margin:0 0 16px;">${d.bodyHtml || e(d.bodyText || '').replace(/\n/g, '<br />')}</div>
${d.ctaUrl ? btn(d.ctaUrl, d.ctaLabel || 'Read More') : ''}`,
        }),
    },
};

/**
 * Render a named template to { subject, html, text, category }.
 * @param {string} name
 * @param {Record<string, any>} data
 * @param {{ appUrl: string, supportEmail: string, billingEmail: string }} ctx
 */
function render(name, data = {}, ctx) {
    const tmpl = TEMPLATES[name];
    if (!tmpl) throw new Error(`Unknown email template: "${name}"`);
    const r = tmpl.render(data, ctx);
    const html = baseLayout({
        content: r.body,
        preview: r.preview,
        appUrl: ctx.appUrl,
        footerNote: r.footerNote || '',
    });
    return { subject: r.subject, html, text: r.text || '', category: tmpl.category };
}

const TEMPLATE_NAMES = Object.keys(TEMPLATES);
const categoryOf = (name) => (TEMPLATES[name] ? TEMPLATES[name].category : undefined);
/** True only for marketing/newsletter templates — these may carry a List-Unsubscribe header. */
const isMarketing = (name) => !!(TEMPLATES[name] && TEMPLATES[name].marketing);

module.exports = { render, TEMPLATE_NAMES, categoryOf, isMarketing, TEMPLATES };
