'use strict';
// Pure-Zod validation of the appointment booking + status schemas, plus the service state machine.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test';

const { test } = require('node:test');
const assert = require('node:assert');

const { bookAppointmentSchema, updateAppointmentStatusSchema } = require('../validators/appointmentSchemas');
const apptService = require('../service/appointmentService');

const VALID_BOOK = {
    customerName: 'Jane Buyer',
    customerEmail: 'buyer@example.com',
    type: 'showroom',
    preferredAt: '2026-07-01T15:00:00Z',
};

test('bookAppointmentSchema accepts a valid booking and defaults type to showroom', () => {
    const r = bookAppointmentSchema.safeParse({ ...VALID_BOOK, type: undefined });
    assert.equal(r.success, true, r.success ? '' : JSON.stringify(r.error.flatten()));
    assert.equal(r.data.type, 'showroom');
});

test('bookAppointmentSchema requires name, valid email, and an ISO datetime', () => {
    assert.equal(bookAppointmentSchema.safeParse({ ...VALID_BOOK, customerName: '' }).success, false);
    assert.equal(bookAppointmentSchema.safeParse({ ...VALID_BOOK, customerEmail: 'bad' }).success, false);
    assert.equal(bookAppointmentSchema.safeParse({ ...VALID_BOOK, preferredAt: 'tomorrow' }).success, false);
});

test('bookAppointmentSchema rejects an unknown appointment type', () => {
    assert.equal(bookAppointmentSchema.safeParse({ ...VALID_BOOK, type: 'teleport' }).success, false);
});

test('updateAppointmentStatusSchema enforces the status enum', () => {
    assert.equal(updateAppointmentStatusSchema.safeParse({ status: 'confirmed' }).success, true);
    assert.equal(updateAppointmentStatusSchema.safeParse({ status: 'rescheduled' }).success, false);
});

test('APPOINTMENT_TRANSITIONS is forward-only with terminal cancelled/completed/no_show', () => {
    const T = apptService.APPOINTMENT_TRANSITIONS;
    assert.deepEqual(T.requested, ['confirmed', 'cancelled']);
    assert.deepEqual(T.confirmed, ['completed', 'cancelled', 'no_show']);
    assert.deepEqual(T.cancelled, []);
    assert.deepEqual(T.completed, []);
    assert.deepEqual(T.no_show, []);
});
