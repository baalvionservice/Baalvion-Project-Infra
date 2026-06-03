'use strict';
// AI Operations console routes. Mounted under /v1/ai (the integrator wires the mount
// in routes/v1.js). Every route is gated by requireSuperAdmin — same super-admin gate
// adminRoutes applies — because this surface manages platform-wide AI configuration,
// cost data and the inference queue.
//
// Path contract is dictated by Frontend/admin-platform/src/lib/api/ai.ts (adminApiClient
// base = .../platform/admin/v1, so these mount at /v1/ai/*).
const router = require('express').Router();
const ctrl   = require('../controller/aiController');
const { requireSuperAdmin } = require('../middleware/authMiddleware');

router.use(requireSuperAdmin);

// Models (static catalog + persisted enable/cost overrides + live usage)
router.get('/models',        ctrl.listModels);
router.get('/models/:id',    ctrl.getModel);
router.patch('/models/:id',  ctrl.updateModel);

// Prompts (versioned registry CRUD)
router.get('/prompts',       ctrl.listPrompts);
router.post('/prompts',      ctrl.createPrompt);
router.get('/prompts/:id',   ctrl.getPrompt);
router.patch('/prompts/:id', ctrl.updatePrompt);
router.delete('/prompts/:id', ctrl.deletePrompt);

// Agents (CRUD + toggle via PATCH { enabled })
router.get('/agents',        ctrl.listAgents);
router.post('/agents',       ctrl.createAgent);
router.get('/agents/:id',    ctrl.getAgent);
router.patch('/agents/:id',  ctrl.updateAgent);

// Usage & cost (aggregated from admin.ai_inference_jobs). Static paths — declared
// before any '/:id' route at this level to avoid capture (none here, but kept explicit).
router.get('/usage/tokens',  ctrl.getTokenUsage);
router.get('/usage/cost',    ctrl.getCostSummary);

// Inference queue
router.get('/queue',         ctrl.listInferenceQueue);
router.post('/queue/:id/retry', ctrl.retryInference);

// Vector store (honest empty when no store is provisioned)
router.get('/vectors/collections',     ctrl.listCollections);
router.get('/vectors/collections/:id', ctrl.getCollection);

// Sandbox (no-execution ack — admin-service is not the inference path)
router.post('/sandbox/test', ctrl.testPrompt);

module.exports = router;
