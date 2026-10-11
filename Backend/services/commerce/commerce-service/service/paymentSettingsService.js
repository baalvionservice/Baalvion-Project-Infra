'use strict';
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { AppError } = require('../utils/errors');

const T = 'commerce.commerce_payment_settings';
const REVIEW_KEY = 'review_wait_minutes';
const MIN_WAIT = 5;
const MAX_WAIT = 30;
const DEFAULT_WAIT = 15;

// How long an admin takes to check a submitted payment. Shown to payers, snapshotted on each payment.
async function getReviewWaitMinutes() {
    const [row] = await sequelize.query(`SELECT value FROM ${T} WHERE key = :k`, { type: QueryTypes.SELECT, replacements: { k: REVIEW_KEY } });
    const n = row ? parseInt(row.value, 10) : DEFAULT_WAIT;
    return Number.isInteger(n) && n >= MIN_WAIT && n <= MAX_WAIT ? n : DEFAULT_WAIT;
}

async function setReviewWaitMinutes(adminUserId, minutes) {
    const n = Number(minutes);
    if (!Number.isInteger(n) || n < MIN_WAIT || n > MAX_WAIT) {
        throw new AppError('VALIDATION_ERROR', `Review wait must be a whole number of minutes from ${MIN_WAIT} to ${MAX_WAIT}`, 400);
    }
    await sequelize.query(
        `INSERT INTO ${T} (key, value, updated_by) VALUES (:k, :v, :by)
         ON CONFLICT (key) DO UPDATE SET value = :v, updated_by = :by, updated_at = NOW()`,
        { replacements: { k: REVIEW_KEY, v: String(n), by: adminUserId } },
    );
    return { reviewWaitMinutes: n };
}

module.exports = { getReviewWaitMinutes, setReviewWaitMinutes, MIN_WAIT, MAX_WAIT, DEFAULT_WAIT };
