'use strict';
// AI Operations console controller. Mirrors adminController.js / featureFlagsController.js:
// thin try/catch handlers that delegate to the service and emit the standard response
// envelope (sendSuccess). Mutations pass req.auth.userId + req.ip for audit.
//
// IMPORTANT envelope note: the AI list endpoints (agents/prompts/queue) are typed on the
// frontend as ApiResponse<PaginatedResponse<T>>, i.e. data = { success, data: [], pagination }.
// That is NOT the admin sendPaginated shape ({ items, total, ... }), so these handlers wrap
// the service's PaginatedResponse object via sendSuccess (same approach as getRiskEvents).
// listModels / listCollections / getCostSummary / getTokenUsage return flat payloads.
const aiService = require('../service/aiService');
const { sendSuccess } = require('../utils/response');

// ── Models ──────────────────────────────────────────────────────────────────
// GET /ai/models → ApiResponse<AiModel[]>
exports.listModels = async (req, res, next) => {
    try {
        const models = await aiService.listModels();
        sendSuccess(req, res, models);
    } catch (err) { next(err); }
};

// GET /ai/models/:id → ApiResponse<AiModel>
exports.getModel = async (req, res, next) => {
    try {
        const model = await aiService.getModel(req.params.id);
        sendSuccess(req, res, model);
    } catch (err) { next(err); }
};

// PATCH /ai/models/:id → ApiResponse<AiModel>
exports.updateModel = async (req, res, next) => {
    try {
        const { enabled, costPer1kInput, costPer1kOutput } = req.body || {};
        const model = await aiService.updateModel(
            req.params.id,
            { enabled, costPer1kInput, costPer1kOutput },
            req.auth.userId,
            req.ip,
        );
        sendSuccess(req, res, model);
    } catch (err) { next(err); }
};

// ── Prompts ──────────────────────────────────────────────────────────────────
// GET /ai/prompts → ApiResponse<PaginatedResponse<Prompt>>
exports.listPrompts = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status, tag } = req.query;
        const result = await aiService.listPrompts({
            page:   Math.max(1, parseInt(page, 10)),
            limit:  Math.min(200, Math.max(1, parseInt(limit, 10))),
            status: status || undefined,
            tag:    tag || undefined,
        });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

// GET /ai/prompts/:id → ApiResponse<Prompt>
exports.getPrompt = async (req, res, next) => {
    try {
        const prompt = await aiService.getPrompt(req.params.id);
        sendSuccess(req, res, prompt);
    } catch (err) { next(err); }
};

// POST /ai/prompts → ApiResponse<Prompt>
exports.createPrompt = async (req, res, next) => {
    try {
        const { name, slug, description, template, modelId, version, status, tags } = req.body || {};
        const prompt = await aiService.createPrompt(
            { name, slug, description, template, modelId, version, status, tags },
            req.auth.userId,
            req.ip,
        );
        sendSuccess(req, res, prompt, 201);
    } catch (err) { next(err); }
};

// PATCH /ai/prompts/:id → ApiResponse<Prompt>
exports.updatePrompt = async (req, res, next) => {
    try {
        const { name, slug, description, template, modelId, version, status, tags } = req.body || {};
        const prompt = await aiService.updatePrompt(
            req.params.id,
            { name, slug, description, template, modelId, version, status, tags },
            req.auth.userId,
            req.ip,
        );
        sendSuccess(req, res, prompt);
    } catch (err) { next(err); }
};

// DELETE /ai/prompts/:id → ApiResponse<void>
exports.deletePrompt = async (req, res, next) => {
    try {
        const result = await aiService.deletePrompt(req.params.id, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

// ── Agents ──────────────────────────────────────────────────────────────────
// GET /ai/agents → ApiResponse<PaginatedResponse<AiAgent>>
exports.listAgents = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const result = await aiService.listAgents({
            page:  Math.max(1, parseInt(page, 10)),
            limit: Math.min(200, Math.max(1, parseInt(limit, 10))),
        });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

// GET /ai/agents/:id → ApiResponse<AiAgent>
exports.getAgent = async (req, res, next) => {
    try {
        const agent = await aiService.getAgent(req.params.id);
        sendSuccess(req, res, agent);
    } catch (err) { next(err); }
};

// POST /ai/agents → ApiResponse<AiAgent>
exports.createAgent = async (req, res, next) => {
    try {
        const { name, description, type, modelId, systemPrompt, tools, enabled, config } = req.body || {};
        const agent = await aiService.createAgent(
            { name, description, type, modelId, systemPrompt, tools, enabled, config },
            req.auth.userId,
            req.ip,
        );
        sendSuccess(req, res, agent, 201);
    } catch (err) { next(err); }
};

// PATCH /ai/agents/:id → ApiResponse<AiAgent>  (also serves toggle — body { enabled })
exports.updateAgent = async (req, res, next) => {
    try {
        const { name, description, type, modelId, systemPrompt, tools, enabled, status, config } = req.body || {};
        const agent = await aiService.updateAgent(
            req.params.id,
            { name, description, type, modelId, systemPrompt, tools, enabled, status, config },
            req.auth.userId,
            req.ip,
        );
        sendSuccess(req, res, agent);
    } catch (err) { next(err); }
};

// ── Usage & Cost ──────────────────────────────────────────────────────────────
// GET /ai/usage/tokens?from&to[&provider] → ApiResponse<TokenUsageStat[]>
exports.getTokenUsage = async (req, res, next) => {
    try {
        const { from, to, provider } = req.query;
        const stats = await aiService.getTokenUsage({
            from:     from || undefined,
            to:       to || undefined,
            provider: provider || undefined,
        });
        sendSuccess(req, res, stats);
    } catch (err) { next(err); }
};

// GET /ai/usage/cost?period=7d|30d|90d → ApiResponse<AiCostSummary>
exports.getCostSummary = async (req, res, next) => {
    try {
        const summary = await aiService.getCostSummary(req.query.period);
        sendSuccess(req, res, summary);
    } catch (err) { next(err); }
};

// ── Inference queue ────────────────────────────────────────────────────────────
// GET /ai/queue → ApiResponse<PaginatedResponse<InferenceQueueItem>>
exports.listInferenceQueue = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const result = await aiService.listInferenceQueue({
            page:   Math.max(1, parseInt(page, 10)),
            limit:  Math.min(200, Math.max(1, parseInt(limit, 10))),
            status: status || undefined,
        });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

// POST /ai/queue/:id/retry → ApiResponse<void>
exports.retryInference = async (req, res, next) => {
    try {
        const result = await aiService.retryInference(req.params.id, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

// ── Vector DB ──────────────────────────────────────────────────────────────────
// GET /ai/vectors/collections → ApiResponse<VectorCollection[]>
exports.listCollections = async (req, res, next) => {
    try {
        const collections = await aiService.listCollections();
        sendSuccess(req, res, collections);
    } catch (err) { next(err); }
};

// GET /ai/vectors/collections/:id → ApiResponse<VectorCollection>
exports.getCollection = async (req, res, next) => {
    try {
        const collection = await aiService.getCollection(req.params.id);
        sendSuccess(req, res, collection);
    } catch (err) { next(err); }
};

// ── Sandbox ──────────────────────────────────────────────────────────────────
// POST /ai/sandbox/test → ApiResponse<{ output, tokensUsed, latencyMs }>
exports.testPrompt = async (req, res, next) => {
    try {
        const { promptId, variables } = req.body || {};
        const result = await aiService.testPrompt({ promptId, variables }, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};
