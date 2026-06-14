'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const keys = require('../controllers/keyController');
const hooks = require('../controllers/webhookController');
const catalog = require('../controllers/catalogController');
const asyncHandler = require('../utils/asyncHandler');
const { internalOrUser, requireInternal } = require('../middleware/authMiddleware');
const { requireDeveloper } = require('../middleware/guards');

const router = express.Router();

// Per-org rate limit on event dispatch — prevents a single org from flooding the
// fan-out queue.  Internal service principals (req.internal) are exempt so that
// trusted platform services can dispatch events freely.
const dispatchRateLimit = rateLimit({
    windowMs: 60_000,          // 1-minute sliding window
    max: 120,                  // 120 dispatches / minute / org  (≈ 2/s burst tolerance)
    keyGenerator: (req) => {
        // Internal callers bypass the limit entirely (return a constant key so
        // they share one very high-ceiling bucket rather than org buckets).
        if (req.internal) return '__internal__';
        return req.auth?.orgId || req.ip;
    },
    skip: (req) => Boolean(req.internal),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Event dispatch rate limit exceeded. Retry after the Retry-After period.' } },
});

// ── internal hot-path (gateway → key verify): strictly service principal ──
router.post('/keys/verify', requireInternal, asyncHandler(keys.verify));

// ── everything below requires a developer role (or X-Internal-Key) ──
router.use(internalOrUser, requireDeveloper);

// API keys
router.post('/keys',            asyncHandler(keys.issue));
router.get('/keys',             asyncHandler(keys.list));
router.get('/keys/:id',         asyncHandler(keys.get));
router.post('/keys/:id/rotate', asyncHandler(keys.rotate));
router.post('/keys/:id/revoke', asyncHandler(keys.revoke));
router.patch('/keys/:id/scopes', asyncHandler(keys.updateScopes));

// Webhook endpoints
router.post('/webhooks',                  asyncHandler(hooks.create));
router.get('/webhooks',                   asyncHandler(hooks.list));
router.get('/webhooks/:id',               asyncHandler(hooks.get));
router.patch('/webhooks/:id',             asyncHandler(hooks.update));
router.post('/webhooks/:id/roll-secret',  asyncHandler(hooks.rollSecret));
router.post('/webhooks/:id/test',         asyncHandler(hooks.sendTest));
router.get('/webhooks/:id/deliveries',    asyncHandler(hooks.listDeliveries));
router.delete('/webhooks/:id',            asyncHandler(hooks.remove));

// Deliveries
router.get('/deliveries',                       asyncHandler(hooks.listDeliveries));
router.post('/deliveries/:deliveryId/redeliver', asyncHandler(hooks.redeliver));

// Event dispatch (service-to-service: emit an event → fan out to subscribers)
// Per-org rate limit applied before the handler.
router.post('/events/dispatch', dispatchRateLimit, asyncHandler(hooks.dispatch));

// OpenAPI specs
router.post('/specs',           asyncHandler(catalog.upsertSpec));
router.get('/specs',            asyncHandler(catalog.listSpecs));
router.get('/specs/:service',   asyncHandler(catalog.getSpec));
router.delete('/specs/:service', asyncHandler(catalog.removeSpec));

// Event types
router.get('/event-types',  asyncHandler(catalog.listEventTypes));
router.post('/event-types', asyncHandler(catalog.registerEventType));

// Sandbox echo (test-mode integration check)
router.all('/sandbox/echo', asyncHandler(catalog.sandboxEcho));

module.exports = router;
