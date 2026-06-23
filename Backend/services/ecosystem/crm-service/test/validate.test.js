'use strict';
// Pure-logic tests for the public-create validation schemas (middleware/validate.js).
// Runs with the Node built-in test runner — NO live DB, NO network:
//   node --test
//
// These assert the PERMISSIVE contract: the schemas only require the fields the underlying
// Sequelize models already mark NOT NULL (customerName for appointments; customerName + subject
// for support tickets) and pass every other field through untouched, so existing storefront
// payloads keep working.
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    appointmentCreateSchema,
    supportTicketCreateSchema,
} = require('../middleware/validate');

test('appointment schema accepts a minimal valid booking (only customerName)', () => {
    const result = appointmentCreateSchema.safeParse({ customerName: 'Julian Vandervilt' });
    assert.equal(result.success, true);
    assert.equal(result.data.customerName, 'Julian Vandervilt');
});

test('appointment schema rejects a missing customerName', () => {
    const result = appointmentCreateSchema.safeParse({ city: 'London' });
    assert.equal(result.success, false);
});

test('appointment schema rejects an empty/whitespace customerName', () => {
    const result = appointmentCreateSchema.safeParse({ customerName: '   ' });
    assert.equal(result.success, false);
});

test('appointment schema rejects a non-string customerName', () => {
    const result = appointmentCreateSchema.safeParse({ customerName: 12345 });
    assert.equal(result.success, false);
});

test('appointment schema passes through extra storefront fields untouched', () => {
    const payload = {
        customerName: 'Sophia Chen',
        customerEmail: 'sophia@lux.net',
        type: 'Virtual Try-on',
        date: '2024-03-22',
        time: '10:30',
        city: 'Dubai',
        notes: 'Prefers afternoon',
        status: 'pending',
    };
    const result = appointmentCreateSchema.safeParse(payload);
    assert.equal(result.success, true);
    // Every passed-through field is preserved verbatim (permissive contract).
    assert.equal(result.data.customerEmail, 'sophia@lux.net');
    assert.equal(result.data.type, 'Virtual Try-on');
    assert.equal(result.data.city, 'Dubai');
    assert.equal(result.data.notes, 'Prefers afternoon');
});

test('appointment schema trims the required customerName', () => {
    const result = appointmentCreateSchema.safeParse({ customerName: '  Alexander Cross  ' });
    assert.equal(result.success, true);
    assert.equal(result.data.customerName, 'Alexander Cross');
});

test('support ticket schema accepts a minimal valid ticket (customerName + subject)', () => {
    const result = supportTicketCreateSchema.safeParse({
        customerName: 'Julian Vandervilt',
        subject: 'Provenance inquiry',
    });
    assert.equal(result.success, true);
    assert.equal(result.data.subject, 'Provenance inquiry');
});

test('support ticket schema rejects a missing subject', () => {
    const result = supportTicketCreateSchema.safeParse({ customerName: 'Sophia Chen' });
    assert.equal(result.success, false);
});

test('support ticket schema rejects a missing customerName', () => {
    const result = supportTicketCreateSchema.safeParse({ subject: 'White-glove delivery' });
    assert.equal(result.success, false);
});

test('support ticket schema passes through extra fields (priority, category, messages)', () => {
    const payload = {
        customerName: 'Sophia Chen',
        subject: 'White-glove delivery scheduling',
        customerTier: 'Gold',
        priority: 'normal',
        category: 'Logistics',
        messages: [{ id: 'm-2', sender: 'customer', text: 'Next Tuesday?' }],
    };
    const result = supportTicketCreateSchema.safeParse(payload);
    assert.equal(result.success, true);
    assert.equal(result.data.priority, 'normal');
    assert.equal(result.data.category, 'Logistics');
    assert.equal(Array.isArray(result.data.messages), true);
    assert.equal(result.data.messages.length, 1);
});
