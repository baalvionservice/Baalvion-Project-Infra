'use strict';
/**
 * Provider-agnostic interface for an EXTERNAL originality/plagiarism/similarity provider.
 *
 * No such provider is wired up anywhere else in this repo today (unlike aiService.js, which
 * already integrates Anthropic/OpenAI) — this module defines the seam so one can be added
 * cleanly later without touching the controller or the panel, per the product spec:
 *
 *   analyzeOriginality(text, options) -> { provider, status, similarity, matches, checkedAt, rawReference }
 *
 * Unlike aiService.js (which reads its env vars into module-level constants at require time),
 * this module reads them INSIDE analyzeOriginality() on every call. That's a deliberate
 * deviation: it lets the key be rotated/configured without a process restart, and — just as
 * importantly for this codebase's test convention (pure node:test, no jest env mocking) — it
 * lets tests toggle the env var between cases without needing to bust the require cache.
 *
 * Status is ALWAYS one of: 'not_configured' | 'checked' | 'error'. This module never throws —
 * a misconfigured or unreachable provider degrades to 'error' so the article editor keeps
 * working. It never logs the API key, never returns it to a caller, and never invents a
 * similarity number when the provider didn't actually return one.
 */

// Provider free-text sent for an originality check is capped — bounds both the request size
// and (mirrors aiController.js's ARTICLE_TEXT_MAX_LEN reasoning) what we'd ever hand to a
// third party.
const TEXT_MAX_LEN = 8000;
const REQUEST_TIMEOUT_MS = 10_000;

function sanitizeText(raw) {
    return String(raw || '').replace(/\x00/g, '').slice(0, TEXT_MAX_LEN);
}

/** True only when the response has the shape we're willing to trust (defense against a malformed/malicious provider). */
function isValidProviderPayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (payload.similarity !== undefined && payload.similarity !== null) {
        if (typeof payload.similarity !== 'number' || Number.isNaN(payload.similarity) || payload.similarity < 0 || payload.similarity > 1) return false;
    }
    if (payload.matches !== undefined && !Array.isArray(payload.matches)) return false;
    return true;
}

/** Keeps only well-shaped, size-bounded match entries — never trusts arbitrary provider fields. */
function normalizeMatches(matches) {
    if (!Array.isArray(matches)) return [];
    return matches.slice(0, 10).map((m) => ({
        source: typeof m?.source === 'string' ? m.source.slice(0, 300) : null,
        url: typeof m?.url === 'string' ? m.url.slice(0, 500) : null,
        similarity: typeof m?.similarity === 'number' && m.similarity >= 0 && m.similarity <= 1 ? m.similarity : null,
        excerpt: typeof m?.excerpt === 'string' ? m.excerpt.slice(0, 400) : null,
    }));
}

/**
 * Runs an external originality/similarity check when a provider is configured via env:
 *   ORIGINALITY_PROVIDER_URL   — the provider's check endpoint (required to enable)
 *   ORIGINALITY_PROVIDER_KEY   — credential, sent server-side only, never returned/logged
 *   ORIGINALITY_PROVIDER_NAME  — display name (defaults to 'external')
 *
 * With no URL/key configured, resolves immediately (no network call, no cost) with
 * status: 'not_configured' — the editor must keep working normally either way.
 */
async function analyzeOriginality(text, options = {}) {
    const url = process.env.ORIGINALITY_PROVIDER_URL || '';
    const key = process.env.ORIGINALITY_PROVIDER_KEY || '';
    const name = process.env.ORIGINALITY_PROVIDER_NAME || 'external';
    const checkedAt = new Date().toISOString();

    if (!url || !key) {
        return { provider: null, status: 'not_configured', similarity: null, matches: [], checkedAt, rawReference: null };
    }

    const cleanText = sanitizeText(text);
    if (!cleanText) {
        return { provider: name, status: 'error', similarity: null, matches: [], checkedAt, rawReference: null };
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
                body: JSON.stringify({ text: cleanText, options: { language: options.language || 'en' } }),
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            return { provider: name, status: 'error', similarity: null, matches: [], checkedAt, rawReference: null };
        }

        const payload = await response.json();
        // Treat every field of the provider's response as UNTRUSTED input — validate shape
        // before using any of it, and never pass it through unchecked.
        if (!isValidProviderPayload(payload)) {
            return { provider: name, status: 'error', similarity: null, matches: [], checkedAt, rawReference: null };
        }

        return {
            provider: name,
            status: 'checked',
            similarity: typeof payload.similarity === 'number' ? payload.similarity : null,
            matches: normalizeMatches(payload.matches),
            checkedAt,
            // Never the full raw provider payload (spec §17: don't store more than needed) —
            // just enough to trace this specific check back to a provider-side reference id.
            rawReference: typeof payload.referenceId === 'string' ? payload.referenceId.slice(0, 200) : null,
        };
    } catch (e) {
        // Network error, timeout, non-JSON body, etc. — never throw out of this module.
        return { provider: name, status: 'error', similarity: null, matches: [], checkedAt, rawReference: null };
    }
}

function isConfigured() {
    return Boolean(process.env.ORIGINALITY_PROVIDER_URL && process.env.ORIGINALITY_PROVIDER_KEY);
}

const TITLE_MAX_LEN = 300;
const SLUG_MAX_LEN = 500;

/**
 * Validates + sanitizes the POST /ai/originality-check request body. Pure and DB-free (unlike
 * the controller it's used from) specifically so it's unit-testable without pulling in
 * models/index.js's env-gated config chain — see test/originalityProvider.test.js.
 * Returns { ok: true, value } or { ok: false, error }.
 */
function validateOriginalityCheckInput(body) {
    const raw = body && typeof body === 'object' ? body : {};
    const content = String(raw.content || '').replace(/\x00/g, '').slice(0, TEXT_MAX_LEN * 3);
    if (!content.trim()) return { ok: false, error: 'content is required' };

    const title = String(raw.title || '').replace(/\x00/g, '').slice(0, TITLE_MAX_LEN);
    const slug = String(raw.slug || '').slice(0, SLUG_MAX_LEN);
    const options = raw.options && typeof raw.options === 'object' && !Array.isArray(raw.options) ? raw.options : {};

    return { ok: true, value: { title, content, slug, options } };
}

module.exports = { analyzeOriginality, isConfigured, isValidProviderPayload, normalizeMatches, validateOriginalityCheckInput };
