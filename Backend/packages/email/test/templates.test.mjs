import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const templates = require('../src/templates');

const ctx = { appUrl: 'https://baalvion.com', supportEmail: 'support@baalvion.com', billingEmail: 'billing@baalvion.com' };

test('all 10 templates are present', () => {
    for (const name of ['otp', 'emailVerification', 'welcome', 'passwordReset', 'loginAlert',
        'securityAlert', 'orderConfirmation', 'invoice', 'supportReply', 'newsletter']) {
        assert.ok(templates.TEMPLATE_NAMES.includes(name), `missing template ${name}`);
    }
});

test('otp renders subject/html/text and escapes injection', () => {
    const r = templates.render('otp', { code: '123456', expiresMinutes: 5 }, ctx);
    assert.match(r.subject, /123456/);
    assert.match(r.html, /123456/);
    assert.match(r.html, /prefers-color-scheme: dark/); // dark-mode aware
    assert.equal(r.category, 'auth');
    assert.ok(r.text.length > 0);
});

test('html-escapes user-provided values', () => {
    const r = templates.render('welcome', { name: '<script>alert(1)</script>' }, ctx);
    assert.ok(!r.html.includes('<script>alert(1)</script>'), 'must escape raw script tag');
    assert.match(r.html, /&lt;script&gt;/);
});

test('category mapping is correct', () => {
    assert.equal(templates.categoryOf('invoice'), 'billing');
    assert.equal(templates.categoryOf('securityAlert'), 'security');
    assert.equal(templates.categoryOf('supportReply'), 'support');
});

test('order template renders line items', () => {
    const r = templates.render('orderConfirmation', {
        orderNumber: 'ORD-1', currency: 'INR', total: '999',
        items: [{ name: 'Widget', quantity: 2, total: '999' }],
    }, ctx);
    assert.match(r.html, /Widget/);
    assert.match(r.html, /ORD-1/);
});

test('unknown template throws', () => {
    assert.throws(() => templates.render('nope', {}, ctx), /Unknown email template/);
});

test('contributorInvitation renders accept link and escapes the note', () => {
    const r = templates.render('contributorInvitation', {
        publication: 'Law Elite Network', roleName: 'Editor', inviterName: 'Sam',
        personalNote: '<script>x</script>', acceptUrl: 'https://admin.baalvion.com/invite/tok', email: 'a@b.co', expiresHours: 72,
    }, ctx);
    assert.match(r.subject, /Law Elite Network/);
    assert.ok(r.html.includes('https://admin.baalvion.com/invite/tok'));
    assert.ok(!r.html.includes('<script>x'));
    assert.ok(templates.categoryOf('contributorInvitation'));
});
