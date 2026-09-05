'use strict';
/**
 * Regenerates the static HTML previews in ./previews from the REAL, live template
 * source in Backend/services/infrastructure/notification-service/templates/. This
 * folder holds generated output only — never hand-edit a file in ./previews, edit
 * the source template and rerun this script instead:
 *
 *   node "Email Templates/generate-previews.cjs"
 *
 * Scoped to the flagship 'baalvion' brand only (single-website-first, per plan —
 * other brands/services get their own preview pass once this one is settled).
 */
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'Backend', 'services', 'infrastructure', 'notification-service', 'templates');
const OUT_DIR = path.join(__dirname, 'previews');

const { render, TEMPLATE_NAMES } = require(TEMPLATES_DIR);

const BRAND = 'baalvion';
const NOW = '2026-09-04T10:30:00.000Z';

// One realistic sample-data object per template. Keys match exactly what
// eventConsumer.js / dispatchService.js pass in for real sends.
const SAMPLE_DATA = {
    welcome:            { brand: BRAND, fullName: 'Asha Mehta' },
    onboardingDay1:     { brand: BRAND, fullName: 'Asha Mehta' },
    onboardingDay3:     { brand: BRAND, fullName: 'Asha Mehta' },
    onboardingDay7:     { brand: BRAND, fullName: 'Asha Mehta' },
    reengagement:       { brand: BRAND, fullName: 'Asha Mehta' },
    leadNotification:   { brand: BRAND, formName: 'Contact form', fields: [
        { label: 'Name', value: 'Rohan Verma' },
        { label: 'Company', value: 'Acme Corp' },
        { label: 'Email', value: 'rohan@acme.example' },
    ], message: 'Interested in the enterprise plan — please reach out this week.' },

    emailVerification: { email: 'asha@example.com', verifyUrl: 'https://app.baalvion.com/verify-email?token=demo' },
    passwordReset:      { resetUrl: 'https://app.baalvion.com/reset-password?token=demo' },
    loginAlert:          { time: NOW, location: 'Mumbai, IN', device: 'Chrome on macOS', ip: '203.0.113.7', secureUrl: 'https://app.baalvion.com/settings/security' },
    securityAlert:       { reason: 'Sign-in from a location that is physically impossible given your last activity', time: NOW, ip: '203.0.113.7', location: 'Mumbai, IN', riskScore: 87, secureUrl: 'https://app.baalvion.com/settings/security' },
    orgInvite:            { inviterName: 'Priya Shah', orgName: 'Acme Corp', role: 'Admin', acceptUrl: 'https://app.baalvion.com/invitations/demo/accept' },
    mfaEnabled:           { secureUrl: 'https://app.baalvion.com/settings/security' },
    impersonationAlert:  { adminEmail: 'support@baalvion.com', time: NOW, expiresAt: '2026-09-04T11:30:00.000Z', sessionId: 'imp_8f3a2c' },

    orderConfirmation: {
        name: 'Asha', orderNumber: 'ORD-1042', currency: 'USD', total: '129.00',
        orderUrl: 'https://app.baalvion.com/orders/1042',
        items: [{ name: 'Widget A', quantity: 2, total: '58.00' }, { name: 'Widget B', quantity: 1, total: '71.00' }],
    },
    orderPaid: {
        name: 'Asha', orderNumber: 'ORD-1042', currency: 'USD', total: '129.00',
        orderUrl: 'https://app.baalvion.com/orders/1042',
        items: [{ name: 'Widget A', quantity: 2, total: '58.00' }, { name: 'Widget B', quantity: 1, total: '71.00' }],
    },
    paymentFailed: {
        orderNumber: 'ORD-2001', amount: '49.00', currency: 'USD',
        reason: 'Card was declined by the issuing bank.',
        retryUrl: 'https://app.baalvion.com/orders/2001/pay',
    },
    paymentRefunded: {
        orderNumber: 'ORD-3001', amount: '25.50', currency: 'USD',
        processedAt: NOW, orderUrl: 'https://app.baalvion.com/orders/3001',
    },
    paymentReminder: {
        orderNumber: 'ORD-4001', amount: '99.00', currency: 'USD',
        dueDate: '2026-09-10T00:00:00.000Z', payUrl: 'https://app.baalvion.com/orders/4001/pay',
    },
    invoice: {
        invoiceNumber: 'INV-5001', currency: 'USD', total: '150.00',
        issuedTo: 'Acme Corp', dueDate: '2026-09-20T00:00:00.000Z',
        invoiceUrl: 'https://app.baalvion.com/invoices/5001',
        items: [{ name: 'Consulting', quantity: 3, total: '150.00' }],
    },
    subscriptionRenewal: {
        planName: 'Pro', amount: '29.00', currency: 'USD',
        nextRenewalDate: '2026-10-04T00:00:00.000Z', manageUrl: 'https://app.baalvion.com/settings/billing',
    },
    subscriptionExpiry: {
        planName: 'Pro', expired: false, expiresAt: '2026-09-10T00:00:00.000Z',
        renewUrl: 'https://app.baalvion.com/settings/billing',
    },
    'subscriptionExpiry-expired': {
        template: 'subscriptionExpiry',
        planName: 'Pro', expired: true, expiresAt: '2026-09-01T00:00:00.000Z',
        renewUrl: 'https://app.baalvion.com/settings/billing',
    },
};

fs.mkdirSync(OUT_DIR, { recursive: true });

const rows = [];
for (const [key, data] of Object.entries(SAMPLE_DATA)) {
    const templateName = data.template || key;
    const fileSlug = key;
    const { subject, html } = render(templateName, data);
    fs.writeFileSync(path.join(OUT_DIR, `${fileSlug}.html`), html, 'utf8');
    rows.push({ fileSlug, templateName, subject });
}

// Flag any real template that has no preview yet, so this stays in sync as new
// templates get added to the service.
const missing = TEMPLATE_NAMES.filter(n => !rows.some(r => r.templateName === n));

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Baalvion — Email Template Previews</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f4f5f7; margin:0; padding:40px; color:#09090b; }
  h1 { font-size:20px; margin:0 0 4px; }
  p.sub { color:#71717a; font-size:13px; margin:0 0 28px; }
  table { border-collapse:collapse; width:100%; max-width:820px; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
  th, td { text-align:left; padding:10px 16px; font-size:13px; border-bottom:1px solid #e4e4e7; }
  th { background:#09090b; color:#fff; font-weight:600; }
  tr:last-child td { border-bottom:none; }
  a { color:#09090b; font-weight:600; }
  code { background:#f4f4f5; padding:1px 6px; border-radius:4px; font-size:12px; }
</style>
</head>
<body>
  <h1>Baalvion — Email Template Previews</h1>
  <p class="sub">Generated by <code>generate-previews.cjs</code> from the live template source. Regenerate after any template edit — never hand-edit files in this folder.</p>
  <table>
    <tr><th>Template</th><th>Subject (rendered)</th><th>Preview</th></tr>
    ${rows.map(r => `<tr><td><code>${r.templateName}</code>${r.fileSlug !== r.templateName ? ` <span style="color:#a1a1aa">(${r.fileSlug})</span>` : ''}</td><td>${r.subject}</td><td><a href="${r.fileSlug}.html" target="_blank">Open →</a></td></tr>`).join('\n    ')}
  </table>
  ${missing.length ? `<p style="color:#dc2626;margin-top:20px;font-size:13px">⚠ No sample data yet for: ${missing.join(', ')} — add an entry to SAMPLE_DATA in generate-previews.cjs.</p>` : ''}
</body>
</html>`;

fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml, 'utf8');

console.log(`Generated ${rows.length} preview(s) + index.html in ${OUT_DIR}`);
if (missing.length) console.warn(`Missing sample data for: ${missing.join(', ')}`);
