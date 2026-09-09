'use strict';

/**
 * Gemini client for the drafting stage.
 *
 * The key is read from the website's own integration record -- pasted into the
 * admin console at Integrations → Google Gemini -- rather than from an
 * environment variable. That is the platform's existing pattern for third-party
 * credentials (encrypted at rest, masked in the console, live without a
 * redeploy), and it means each site can run on its own key and its own model.
 * GEMINI_API_KEY is honoured as a fallback for scripts and local work.
 *
 * There is no offline or stub mode. A missing key raises, and the pipeline holds
 * the story -- inventing an article without a model, or quietly degrading to
 * something that reads like one, is precisely the failure this pipeline exists
 * to prevent.
 */

const { CmsWebsite, CmsWebsiteIntegration } = require('../../models');
const secretCrypto = require('../../utils/secretCrypto');
const { AppError } = require('../../utils/errors');
const { logger } = require('../../platform/logger');

const log = logger('editorial-llm');

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const TIMEOUT_MS = Number(process.env.EDITORIAL_LLM_TIMEOUT_MS || 90000);

/**
 * Resolves { apiKey, model } for a website. Prefers the console-managed
 * integration; falls back to the environment.
 */
async function resolveCredentials(websiteId) {
    const row = await CmsWebsiteIntegration.findOne({ where: { websiteId, provider: 'gemini' } });
    if (row) {
        const secrets = secretCrypto.decrypt(row.secretsEnc) || {};
        const cfg = row.config || {};
        const apiKey = secrets.apiKey || cfg.apiKey || null;
        if (apiKey && row.enabled !== false) {
            return { apiKey, model: cfg.model || DEFAULT_MODEL, source: 'integration' };
        }
        if (apiKey && row.enabled === false) {
            throw new AppError(
                'LLM_DISABLED',
                'The Gemini integration for this website is saved but switched off. Enable it in Integrations → Google Gemini.',
                409
            );
        }
    }

    const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (envKey) return { apiKey: envKey, model: process.env.GEMINI_MODEL || DEFAULT_MODEL, source: 'env' };

    const site = await CmsWebsite.findByPk(websiteId);
    throw new AppError(
        'LLM_NOT_CONFIGURED',
        `No Gemini API key for ${site ? site.name : 'this website'}. Add one in the admin console under Integrations → Google Gemini, then press Test.`,
        409
    );
}

/**
 * One structured generation call. `schema` is a Gemini responseSchema; passing
 * one makes the model return parseable JSON instead of prose that has to be
 * scraped, which is what keeps citations attached to the claims they belong to.
 *
 * Returns { data, model, usage }. Throws on transport failure, on a refusal, and
 * on unparseable output -- every one of which must hold the story rather than
 * produce a half-written draft.
 */
async function generateJson(websiteId, { system, prompt, schema, temperature = 0.4, maxOutputTokens = 4096 }) {
    const { apiKey, model, source } = await resolveCredentials(websiteId);

    const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature,
            maxOutputTokens,
            responseMimeType: 'application/json',
            ...(schema ? { responseSchema: schema } : {}),
        },
    };
    if (system) body.systemInstruction = { parts: [{ text: system }] };

    let res;
    try {
        res = await fetch(`${API_ROOT}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch (err) {
        throw new AppError('LLM_UNREACHABLE', `Could not reach Gemini: ${err.message}`, 502);
    }

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        // The key lives in the console, so a 400/403 is an actionable console
        // problem rather than an opaque upstream error.
        const hint = res.status === 400 || res.status === 403
            ? ' Check the key and model in Integrations → Google Gemini.'
            : '';
        throw new AppError('LLM_ERROR', `Gemini returned ${res.status}.${hint} ${text.slice(0, 300)}`, 502);
    }

    const payload = await res.json();
    const candidate = payload.candidates && payload.candidates[0];

    // A truncated response is not a partial success: half a draft with half its
    // citations is worse than none, because the missing half is invisible.
    if (candidate && candidate.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
        throw new AppError('LLM_REFUSED', `Gemini stopped early (${candidate.finishReason}).`, 502);
    }
    if (candidate && candidate.finishReason === 'MAX_TOKENS') {
        throw new AppError('LLM_TRUNCATED', 'Gemini hit the output limit before finishing. Shorten the brief or raise maxOutputTokens.', 502);
    }

    const text = candidate && candidate.content && candidate.content.parts
        ? candidate.content.parts.map((p) => p.text || '').join('')
        : '';
    if (!text.trim()) throw new AppError('LLM_EMPTY', 'Gemini returned no content.', 502);

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new AppError('LLM_BAD_JSON', `Gemini returned unparseable JSON: ${text.slice(0, 200)}`, 502);
    }

    const usage = payload.usageMetadata || {};
    log.info({ model, source, promptTokens: usage.promptTokenCount, outputTokens: usage.candidatesTokenCount }, 'generation complete');
    return { data, model, usage };
}

/** Whether this website can draft at all — used to explain a held story. */
async function isConfigured(websiteId) {
    try {
        await resolveCredentials(websiteId);
        return true;
    } catch {
        return false;
    }
}

module.exports = { generateJson, resolveCredentials, isConfigured, DEFAULT_MODEL };
