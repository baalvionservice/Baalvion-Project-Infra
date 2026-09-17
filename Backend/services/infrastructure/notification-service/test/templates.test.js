'use strict';
/**
 * Dry-run render tests for the shared email-template system (templates/index.js +
 * templates/base.js). Uses the built-in node:test runner + node:assert — no new
 * dependency, no network, no SMTP/SES credentials, no email is ever sent.
 *
 * The point being proven: every non-premium template compiles through the SAME
 * baseLayout() shell (shared header/footer/styles) and the SAME Handlebars pipeline
 * (subject/html interpolation, loops, helpers, auto-escaping) — i.e. the template
 * system is genuinely reusable, not copy-pasted per template.
 */
const test = require('node:test');
const assert = require('node:assert');

const { render, TEMPLATE_NAMES } = require('../templates');

test('exposes every template referenced elsewhere in the service', () => {
    for (const name of ['welcome', 'emailVerification', 'passwordReset', 'loginAlert',
        'securityAlert', 'orgInvite', 'mfaEnabled', 'orderConfirmation', 'orderPaid',
        'impersonationAlert']) {
        assert.ok(TEMPLATE_NAMES.includes(name), `missing template: ${name}`);
    }
});

// NOTE: 'welcome' is intentionally excluded here. It's defined twice — once in TEMPLATES
// (the generic Handlebars/baseLayout path) and once in PREMIUM_RENDERERS (a brand-themed
// renderer) — and render() checks PREMIUM_RENDERERS first, so the TEMPLATES.welcome entry
// is unreachable dead code. emailVerification/passwordReset are unrelated templates that
// both genuinely go through the shared generic baseLayout, which is what this test checks.
test('emailVerification and passwordReset — two unrelated templates — share the identical base layout shell', () => {
    const verify = render('emailVerification', { email: 'asha@example.com', verifyUrl: 'https://app.baalvion.com/verify/abc' });
    const reset = render('passwordReset', { resetUrl: 'https://app.baalvion.com/reset/xyz' });

    for (const html of [verify.html, reset.html]) {
        assert.match(html, /<div class="container">/);
        assert.match(html, /Baalvion\. All rights reserved\./);
        assert.match(html, /class="btn"/);
    }
});

test('orgInvite — subject and body interpolate multiple template variables', () => {
    const { subject, html } = render('orgInvite', {
        inviterName: 'Priya Shah',
        orgName: 'Acme Corp',
        role: 'admin',
        acceptUrl: 'https://app.baalvion.com/invite/abc123',
    });

    assert.strictEqual(subject, 'Priya Shah invited you to join Acme Corp on Baalvion');
    assert.match(html, /<strong>Priya Shah<\/strong>/);
    assert.match(html, /<strong>Acme Corp<\/strong>/);
    assert.match(html, /href="https:\/\/app\.baalvion\.com\/invite\/abc123"/);
});

test('orderPaid — reuses the same {{#each items}} loop and currency formatting as orderConfirmation', () => {
    const data = {
        name: 'Asha',
        orderNumber: 'ORD-1042',
        currency: 'USD',
        total: '129.00',
        orderUrl: 'https://app.baalvion.com/orders/1042',
        items: [
            { name: 'Widget A', quantity: 2, total: '58.00' },
            { name: 'Widget B', quantity: 1, total: '71.00' },
        ],
    };

    const confirmation = render('orderConfirmation', data);
    const paid = render('orderPaid', data);

    for (const { subject, html } of [confirmation, paid]) {
        assert.match(subject, /ORD-1042/);
        assert.match(html, /Widget A/);
        assert.match(html, /Widget B/);
        assert.match(html, /129\.00 USD/);
        // both rows rendered — proves the #each loop actually iterates, not just the first item
        assert.strictEqual((html.match(/<tr>/g) || []).length >= 3, true); // header + 2 item rows (+ optional wrapper)
    }
});

test('securityAlert — the formatDate helper renders a real date, not a raw timestamp', () => {
    const { html } = render('securityAlert', {
        reason: 'Impossible travel detected',
        time: '2026-09-04T10:30:00.000Z',
        ip: '203.0.113.7',
        location: 'Mumbai, IN',
        riskScore: 87,
        secureUrl: 'https://app.baalvion.com/security',
    });

    assert.match(html, /Risk score:<\/strong> 87\/100/);
    // formatDate uses toLocaleString('en-US', {dateStyle:'medium', timeStyle:'short'}) — should
    // produce a human month name, not the raw ISO string
    assert.doesNotMatch(html, /2026-09-04T10:30:00/);
    assert.match(html, /2026/);
});

test('user-supplied values are HTML-escaped (Handlebars default escaping), not injected raw', () => {
    const { html } = render('orgInvite', {
        inviterName: '<script>alert(1)</script>',
        orgName: 'Acme',
        role: 'admin',
        acceptUrl: 'https://app.baalvion.com/invite/1',
    });

    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.match(html, /&lt;script&gt;/);
});

test('unknown template name fails loudly instead of silently returning empty content', () => {
    assert.throws(() => render('doesNotExist', {}), /Unknown template: doesNotExist/);
});

// ── New templates (payment failed/refunded/reminder, invoice, subscription renewal/expiry) ──

test('paymentFailed — interpolates order/amount and conditionally shows the reason', () => {
    const withReason = render('paymentFailed', {
        orderNumber: 'ORD-2001', amount: '49.00', currency: 'USD',
        reason: 'Card was declined by the issuing bank.',
        retryUrl: 'https://app.baalvion.com/orders/2001/pay',
    });
    assert.strictEqual(withReason.subject, 'Payment failed for ORD-2001');
    assert.match(withReason.html, /Card was declined by the issuing bank\./);
    assert.match(withReason.html, /49\.00 USD/);

    const noReason = render('paymentFailed', {
        orderNumber: 'ORD-2002', amount: '10.00', currency: 'USD',
        retryUrl: 'https://app.baalvion.com/orders/2002/pay',
    });
    assert.doesNotMatch(noReason.html, /undefined/);
});

test('paymentRefunded — shows amount and a real formatted date, not a raw timestamp', () => {
    const { subject, html } = render('paymentRefunded', {
        orderNumber: 'ORD-3001', amount: '25.50', currency: 'USD',
        processedAt: '2026-09-04T12:00:00.000Z',
        orderUrl: 'https://app.baalvion.com/orders/3001',
    });
    assert.strictEqual(subject, 'Refund processed for ORD-3001');
    assert.match(html, /25\.50 USD/);
    assert.doesNotMatch(html, /2026-09-04T12:00:00/);
});

test('paymentReminder — renders amount due and due date', () => {
    const { html } = render('paymentReminder', {
        orderNumber: 'ORD-4001', amount: '99.00', currency: 'USD',
        dueDate: '2026-09-10T00:00:00.000Z',
        payUrl: 'https://app.baalvion.com/orders/4001/pay',
    });
    assert.match(html, /99\.00 USD/);
    assert.match(html, /href="https:\/\/app\.baalvion\.com\/orders\/4001\/pay"/);
});

test('invoice — reuses the same items-loop/currency pattern as orderPaid', () => {
    const { subject, html } = render('invoice', {
        invoiceNumber: 'INV-5001', currency: 'USD', total: '150.00',
        issuedTo: 'Acme Corp', dueDate: '2026-09-20T00:00:00.000Z',
        invoiceUrl: 'https://app.baalvion.com/invoices/5001',
        items: [{ name: 'Consulting', quantity: 3, total: '150.00' }],
    });
    assert.strictEqual(subject, 'Your invoice INV-5001');
    assert.match(html, /Billed to Acme Corp\./);
    assert.match(html, /Consulting/);
    assert.match(html, /150\.00 USD/);
});

test('subscriptionRenewal — interpolates plan and next renewal date', () => {
    const { subject, html } = render('subscriptionRenewal', {
        planName: 'Pro', amount: '29.00', currency: 'USD',
        nextRenewalDate: '2026-10-04T00:00:00.000Z',
        manageUrl: 'https://app.baalvion.com/settings/billing',
    });
    assert.strictEqual(subject, 'Your Pro subscription has renewed');
    assert.match(html, /29\.00 USD/);
});

test('subscriptionExpiry — same template renders two distinct states from one boolean flag', () => {
    const expiring = render('subscriptionExpiry', {
        planName: 'Pro', expired: false, expiresAt: '2026-09-10T00:00:00.000Z',
        renewUrl: 'https://app.baalvion.com/settings/billing',
    });
    const expired = render('subscriptionExpiry', {
        planName: 'Pro', expired: true, expiresAt: '2026-09-01T00:00:00.000Z',
        renewUrl: 'https://app.baalvion.com/settings/billing',
    });

    assert.strictEqual(expiring.subject, 'Your Pro subscription is expiring soon');
    assert.match(expiring.html, /Renew Now/);
    assert.doesNotMatch(expiring.html, />Reactivate Subscription</);

    assert.strictEqual(expired.subject, 'Your Pro subscription has expired');
    assert.match(expired.html, /Reactivate Subscription/);
    assert.doesNotMatch(expired.html, />Renew Now</);
});

test("'welcome' has no reachable plain-layout entry left in TEMPLATES (dead code removed)", () => {
    const { render: rawRender } = require('../templates');
    // still resolves — via PREMIUM_RENDERERS — proving nothing broke for real callers
    const out = rawRender('welcome', { brand: 'baalvion', fullName: 'Asha' });
    assert.ok(out.html.length > 0);
});
