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
// The floating alias, not a pinned version. A pinned model becomes a 404 the
// moment Google closes it to new users -- 'gemini-2.5-flash' did exactly that,
// and every brief failed with a 404 until the name was changed. A site that
// wants a specific version sets it on its own integration record.
const DEFAULT_MODEL = 'gemini-flash-latest';
const TIMEOUT_MS = Number(process.env.EDITORIAL_LLM_TIMEOUT_MS || 90000);

// 429 and 503 are load, not a bad request: the model is busy or the quota
// window is full, and the same call succeeds shortly after. Without a retry a
// single spike marks every brief in the run as failed and an editor arrives to
// an empty queue with nothing wrong. Retries are capped and backed off so a
// genuine outage still fails fast rather than holding the run open.
const RETRY_STATUSES = new Set([429, 503]);
const MAX_ATTEMPTS = Number(process.env.EDITORIAL_LLM_ATTEMPTS || 4);
// A stated retry delay is honoured up to this; beyond it the story is held for
// the next run rather than parking a worker for minutes.
const MAX_RETRY_WAIT_MS = Number(process.env.EDITORIAL_LLM_MAX_WAIT_MS || 45000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * How long Google says to wait, in ms, or null.
 *
 * A 429 carries the real answer in two places: a RetryInfo detail and a
 * "Please retry in 34.1s" sentence in the message. Guessing with exponential
 * backoff instead means either sleeping far longer than needed or hammering a
 * quota window that has not reopened -- on the free tier, where the limit is 20
 * requests, the difference decides whether a run finishes at all.
 */
function retryAfterMs(bodyText) {
    try {
        const parsed = JSON.parse(bodyText);
        const info = (parsed.error && parsed.error.details || [])
            .find((d) => String(d['@type'] || '').endsWith('RetryInfo'));
        if (info && info.retryDelay) {
            const secs = parseFloat(String(info.retryDelay).replace(/s$/, ''));
            if (Number.isFinite(secs)) return Math.ceil(secs * 1000);
        }
        const m = String(parsed.error && parsed.error.message || '').match(/retry in ([\d.]+)\s*s/i);
        if (m) return Math.ceil(parseFloat(m[1]) * 1000);
    } catch { /* not JSON — fall back to the caller's backoff */ }
    return null;
}

/**
 * Resolves { apiKey, model } for a website. Prefers the console-managed
 * integration; falls back to the environment.
 */
// OpenRouter fronts many providers behind one OpenAI-compatible endpoint, which
// matters here for a practical reason: Google's free tier caps generate_content
// at 20 requests, and a desk publishing six articles a day spends more than that
// on briefs alone.
const OPENROUTER_ROOT = 'https://openrouter.ai/api/v1';
const OPENROUTER_DEFAULT_MODEL = 'google/gemini-2.5-flash';

/**
 * Resolves { provider, apiKey, model } for a website.
 *
 * OpenRouter is preferred when configured because it is the one with headroom; a
 * direct Gemini key still works and is used when it is the only thing set.
 * Environment variables are the last resort, for scripts and local work.
 */
async function resolveCredentials(websiteId) {
    const rows = await CmsWebsiteIntegration.findAll({
        where: { websiteId, provider: ['openrouter', 'gemini'] },
    });

    for (const provider of ['openrouter', 'gemini']) {
        const row = rows.find((r) => r.provider === provider);
        if (!row) continue;
        const secrets = secretCrypto.decrypt(row.secretsEnc) || {};
        const cfg = row.config || {};
        const apiKey = secrets.apiKey || cfg.apiKey || null;
        if (!apiKey) continue;
        if (row.enabled === false) {
            throw new AppError(
                'LLM_DISABLED',
                `The ${provider} integration for this website is saved but switched off. Enable it in Integrations.`,
                409,
            );
        }
        return {
            provider,
            apiKey,
            model: cfg.model || (provider === 'openrouter' ? OPENROUTER_DEFAULT_MODEL : DEFAULT_MODEL),
            source: 'integration',
        };
    }

    if (process.env.OPENROUTER_API_KEY) {
        return {
            provider: 'openrouter',
            apiKey: process.env.OPENROUTER_API_KEY,
            model: process.env.OPENROUTER_MODEL || OPENROUTER_DEFAULT_MODEL,
            source: 'env',
        };
    }
    const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (envKey) {
        return { provider: 'gemini', apiKey: envKey, model: process.env.GEMINI_MODEL || DEFAULT_MODEL, source: 'env' };
    }

    const site = await CmsWebsite.findByPk(websiteId);
    throw new AppError(
        'LLM_NOT_CONFIGURED',
        `No model key for ${site ? site.name : 'this website'}. Add an OpenRouter or Google Gemini key in the admin console under Integrations, then press Test.`,
        409,
    );
}

/**
 * Gemini's responseSchema dialect to JSON Schema.
 *
 * The two differ in case ('OBJECT' vs 'object') and in strictness: OpenAI-style
 * structured output rejects a schema whose `required` omits any property, so
 * every key is marked required. Optional fields arrive as empty arrays or
 * strings rather than absent, which the callers already tolerate.
 */
function toJsonSchema(node) {
    if (!node || typeof node !== 'object') return node;
    const type = String(node.type || '').toLowerCase();
    if (type === 'object') {
        const properties = {};
        for (const [k, v] of Object.entries(node.properties || {})) properties[k] = toJsonSchema(v);
        return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
    }
    if (type === 'array') return { type: 'array', items: toJsonSchema(node.items) };
    return { type: type || 'string' };
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
    const { provider, apiKey, model, source } = await resolveCredentials(websiteId);

    const openrouter = provider === 'openrouter';

    const body = openrouter
        ? {
            model,
            messages: [
                ...(system ? [{ role: 'system', content: system }] : []),
                { role: 'user', content: prompt },
            ],
            temperature,
            max_tokens: maxOutputTokens,
            ...(schema
                ? { response_format: { type: 'json_schema', json_schema: { name: 'editorial', strict: true, schema: toJsonSchema(schema) } } }
                : { response_format: { type: 'json_object' } }),
        }
        : {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature,
                maxOutputTokens,
                responseMimeType: 'application/json',
                ...(schema ? { responseSchema: schema } : {}),
            },
            ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        };

    const url = openrouter
        ? `${OPENROUTER_ROOT}/chat/completions`
        : `${API_ROOT}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // OpenRouter asks callers to identify themselves; these headers are what its
    // dashboard attributes usage to.
    const headers = openrouter
        ? {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://admin.baalvion.com',
            'X-Title': 'Baalvion Editorial Pipeline',
        }
        : { 'Content-Type': 'application/json' };
    let res;
    let lastTransport = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
            res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(TIMEOUT_MS),
            });
        } catch (err) {
            // A transport failure is retried on the same terms as a 503 -- a
            // dropped connection mid-spike is the same event seen from the
            // other side.
            lastTransport = err;
            res = null;
        }

        if (res && !RETRY_STATUSES.has(res.status)) break;
        if (attempt === MAX_ATTEMPTS) break;

        // Prefer the wait Google states over a guess; fall back to 2s/4s/8s with
        // jitter so a run's calls do not all return together and re-spike the
        // same window. Capped so a long stated delay cannot hold a run open.
        let waitMs = null;
        if (res) {
            const peek = await res.clone().text().catch(() => '');
            waitMs = retryAfterMs(peek);
        }
        const backoff = 1000 * 2 ** attempt + Math.floor(Math.random() * 400);
        const delay = Math.min(waitMs ?? backoff, MAX_RETRY_WAIT_MS);
        log.warn(
            { model, attempt, status: res ? res.status : 'transport', delayMs: delay, stated: waitMs !== null },
            'gemini unavailable — waiting before retry',
        );
        await sleep(delay);
    }

    if (!res) {
        throw new AppError('LLM_UNREACHABLE', `Could not reach Gemini after ${MAX_ATTEMPTS} attempts: ${lastTransport ? lastTransport.message : 'unknown'}`, 502);
    }

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        // The key lives in the console, so a 400/403 is an actionable console
        // problem rather than an opaque upstream error.
        const hint = res.status === 400 || res.status === 403
            ? ' Check the key and model in Integrations → Google Gemini.'
            : RETRY_STATUSES.has(res.status)
                ? ` Still busy after ${MAX_ATTEMPTS} attempts — the story is held, not lost; the next run retries it.`
                : '';
        throw new AppError('LLM_ERROR', `Gemini returned ${res.status}.${hint} ${text.slice(0, 300)}`, 502);
    }

    const payload = await res.json();

    if (openrouter) {
        const choice = payload.choices && payload.choices[0];
        const finish = choice && choice.finish_reason;
        if (finish === 'length') {
            throw new AppError('LLM_TRUNCATED', 'The model hit the output limit before finishing. Shorten the brief or raise maxOutputTokens.', 502);
        }
        if (finish && !['stop', 'end_turn', null].includes(finish)) {
            throw new AppError('LLM_REFUSED', `The model stopped early (${finish}).`, 502);
        }
        const content = (choice && choice.message && choice.message.content) || '';
        if (!String(content).trim()) throw new AppError('LLM_EMPTY', 'The model returned no content.', 502);
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch {
            throw new AppError('LLM_BAD_JSON', `The model returned unparseable JSON: ${String(content).slice(0, 200)}`, 502);
        }
        const u = payload.usage || {};
        log.info(
            { provider, model, source, promptTokens: u.prompt_tokens, outputTokens: u.completion_tokens },
            'generation complete',
        );
        return { data: parsed, model, usage: u };
    }

    const candidate = payload.candidates && payload.candidates[0];

    // A truncated response is not a partial success: half a draft with half its
    // citations is worse than none, because the missing half is invisible.
    if (candidate && candidate.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
        throw new AppError('LLM_REFUSED', `Gemini stopped early (${candidate.finishReason}).`, 502);
    }
    if (candidate && candidate.finishReason === 'MAX_TOKENS') {
        throw new AppError('LLM_TRUNCATED', 'Gemini hit the output limit before finishing. Shorten the brief or raise maxOutputTokens.', 502);
    }

    // Thinking models return their reasoning as extra parts alongside the answer.
    // Concatenating everything yields text that is not the JSON that was asked
    // for, so reasoning parts are dropped rather than parsed.
    const parts = (candidate && candidate.content && candidate.content.parts) || [];
    const text = parts.filter((p) => p && p.thought !== true).map((p) => p.text || '').join('');
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

module.exports = { generateJson, resolveCredentials, isConfigured, toJsonSchema, DEFAULT_MODEL, OPENROUTER_DEFAULT_MODEL };
