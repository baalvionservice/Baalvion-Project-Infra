'use strict';
const operationsService = require('../service/operationsService');
const analyticsService = require('../service/analyticsService');
const platformStateService = require('../service/platformStateService');
const { asyncHandler, q } = require('./asyncHandler');
const { sendSuccess } = require('../utils/response');

/**
 * Operational reads: the moderation command centre, product analytics, dependency health and
 * the configuration that changes what the product does.
 *
 * All four are aggregates. None of them accepts an identifier, so none can be pointed at a
 * person — there is no `?userId=` to add later without noticing, because there is nothing to
 * add it to. The route table decides who may call them; every one is staff-only, and the two
 * that describe the platform rather than the queue are administrator-only.
 */

/** Queue health, suspensions in force, recent decisions. Counts and types, never content. */
const summary = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await operationsService.summary()));

/**
 * Aggregated product health for one time window.
 *
 * The definitions travel with the numbers so the dashboard cannot label a metric differently
 * from how it is computed.
 */
const analytics = asyncHandler(async (req, res) => {
    const { window } = q(req);
    const [overview, byReason] = await Promise.all([
        analyticsService.overview(window),
        analyticsService.reportsByReason(window),
    ]);
    return sendSuccess(req, res, {
        ...overview,
        reportsByReason: byReason,
        definitions: analyticsService.DEFINITIONS,
        windows: Object.entries(analyticsService.WINDOWS).map(([key, w]) => ({ key, label: w.label })),
    });
});

/** Whether each dependency answered, and how quickly. No connection detail is returned. */
const health = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await platformStateService.health()));

/** Read-only. There is no write path, because a toggle here would not change the backend. */
const configuration = asyncHandler(async (req, res) =>
    sendSuccess(req, res, { items: platformStateService.configuration() }));

module.exports = { summary, analytics, health, configuration };
