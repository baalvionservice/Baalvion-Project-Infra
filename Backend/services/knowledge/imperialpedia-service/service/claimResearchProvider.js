'use strict';
/**
 * PROMPT 3 — Fact & Source Intelligence, STAGE B: explicit, user-triggered claim verification.
 *
 * Provider-agnostic, mirrors originalityProvider.js's shape and guarantees:
 *   - reads env vars INSIDE researchClaims() on every call (no restart needed to rotate/configure)
 *   - NEVER throws — a misconfigured/unreachable/malformed provider degrades to a per-claim
 *     'needs_research' status so the editor keeps working
 *   - NEVER fabricates a source, URL, title, date, or quotation. With no provider configured,
 *     every claim comes back 'needs_research' — never 'verified'.
 *   - the API key never leaves this module (not logged, not echoed back to the caller)
 *
 * Env:
 *   RESEARCH_PROVIDER_URL   — the provider's claim-research endpoint (required to enable)
 *   RESEARCH_PROVIDER_KEY   — credential, sent server-side only
 *   RESEARCH_PROVIDER_NAME  — display name (defaults to 'external')
 *
 * No such provider is wired up anywhere else in this repo — this defines the seam only.
 */

const { buildResearchQuery } = require('./claimDetectionService');

const REQUEST_TIMEOUT_MS = 12_000;
const CLAIM_TEXT_MAX_LEN = 600;
// Bounds how many claims get sent for research in one explicit "Verify Claims" action — the
// most important claims first (spec §11 step 2: "prioritize the most important claims"), so a
// long article's full claim list never turns into an unbounded batch of provider calls.
const MAX_CLAIMS_PER_REQUEST = 8;

// In-memory research cache: fingerprint -> { result, expiresAt }. Deliberately not Redis (spec
// §28/§29 — don't add infrastructure this feature doesn't already need). Content changes
// invalidate naturally because the fingerprint is derived from the claim text itself; entries
// simply expire after CACHE_TTL_MS and are never persisted across a process restart.
const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map();
// Dedupes concurrent identical requests (spec §27: "prevent duplicate research requests while
// one is running") — in-flight promises keyed by the same fingerprint, shared rather than
// re-fired.
const inFlight = new Map();

const SEVERITY_RANK = { CRITICAL: 0, WARNING: 1, SUGGESTION: 2 };

function fingerprint(claim, jurisdiction) {
    // Cheap, deterministic, dependency-free string hash (FNV-1a) — good enough for a cache key,
    // not used for anything security-sensitive.
    const input = `${claim.text}::${jurisdiction || ''}`;
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16);
}

function prioritizeClaims(claims) {
    return [...claims]
        .filter((c) => c && c.text)
        .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3))
        .slice(0, MAX_CLAIMS_PER_REQUEST);
}

/** Defense against a malformed/malicious provider — same discipline as originalityProvider.js. */
function isValidSource(s) {
    if (!s || typeof s !== 'object') return false;
    if (typeof s.title !== 'string' || !s.title.trim()) return false;
    if (typeof s.url !== 'string' || !/^https?:\/\//i.test(s.url)) return false;
    if (s.sourceType !== undefined && s.sourceType !== null && typeof s.sourceType !== 'string') return false;
    if (s.authorityLevel !== undefined && s.authorityLevel !== null && !['primary', 'secondary', 'general'].includes(s.authorityLevel)) return false;
    if (s.publishedAt !== undefined && s.publishedAt !== null && typeof s.publishedAt !== 'string') return false;
    if (s.relevance !== undefined && s.relevance !== null && typeof s.relevance !== 'string') return false;
    if (s.supportsClaim !== undefined && s.supportsClaim !== null && typeof s.supportsClaim !== 'boolean') return false;
    if (s.notes !== undefined && s.notes !== null && typeof s.notes !== 'string') return false;
    return true;
}

function normalizeSource(s) {
    return {
        title: s.title.slice(0, 300),
        url: s.url.slice(0, 800),
        sourceType: typeof s.sourceType === 'string' ? s.sourceType.slice(0, 100) : null,
        authorityLevel: s.authorityLevel || null, // 'primary' | 'secondary' | 'general' | null
        publishedAt: typeof s.publishedAt === 'string' ? s.publishedAt.slice(0, 40) : null,
        relevance: typeof s.relevance === 'string' ? s.relevance.slice(0, 300) : null,
        supportsClaim: typeof s.supportsClaim === 'boolean' ? s.supportsClaim : null,
        notes: typeof s.notes === 'string' ? s.notes.slice(0, 500) : null,
    };
}

/**
 * Derives an honest evidence status from a set of already-validated sources. Never invents
 * certainty: no sources -> NO_SOURCE_FOUND; sources exist but none say yes/no -> UNCLEAR;
 * credible sources disagree -> PARTIALLY_SUPPORTED (+ sourceConflict flag, spec §15 — no
 * automatic winner is chosen); otherwise SUPPORTED or CONTRADICTED.
 */
function deriveEvidence(sources) {
    if (!sources.length) return { status: 'NO_SOURCE_FOUND', sourceConflict: false };
    const credible = sources.filter((s) => s.authorityLevel === 'primary' || s.authorityLevel === 'secondary');
    const pool = credible.length ? credible : sources;
    const supporting = pool.filter((s) => s.supportsClaim === true);
    const contradicting = pool.filter((s) => s.supportsClaim === false);
    if (supporting.length && contradicting.length) return { status: 'PARTIALLY_SUPPORTED', sourceConflict: true };
    if (supporting.length) return { status: 'SUPPORTED', sourceConflict: false };
    if (contradicting.length) return { status: 'CONTRADICTED', sourceConflict: false };
    return { status: 'UNCLEAR', sourceConflict: false };
}

function isConfigured() {
    return Boolean(process.env.RESEARCH_PROVIDER_URL && process.env.RESEARCH_PROVIDER_KEY);
}

/** One claim's research call — never throws, always resolves to a claim-result shape. */
async function researchOneClaim(claim, { jurisdiction, url, key, name } = {}) {
    const query = buildResearchQuery(claim);
    const claimText = String(claim.text || '').slice(0, CLAIM_TEXT_MAX_LEN);

    if (!url || !key) {
        return {
            claimId: claim.id,
            claimText,
            query,
            status: 'needs_research',
            sourceConflict: false,
            sources: [],
            note: 'No research provider is configured. Verify this claim manually against a primary source.',
        };
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
                body: JSON.stringify({ query, claim: claimText, jurisdiction: jurisdiction || null, category: claim.category }),
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            return { claimId: claim.id, claimText, query, status: 'needs_research', sourceConflict: false, sources: [], note: `Research provider returned an error (HTTP ${response.status}).` };
        }

        const payload = await response.json();
        if (!payload || typeof payload !== 'object' || !Array.isArray(payload.sources)) {
            return { claimId: claim.id, claimText, query, status: 'needs_research', sourceConflict: false, sources: [], note: 'Research provider returned an unexpected response shape.' };
        }

        const sources = payload.sources.filter(isValidSource).slice(0, 8).map(normalizeSource);
        const { status, sourceConflict } = deriveEvidence(sources);

        return {
            claimId: claim.id,
            claimText,
            query,
            status, // SUPPORTED | CONTRADICTED | PARTIALLY_SUPPORTED | UNCLEAR | NO_SOURCE_FOUND
            sourceConflict,
            sources,
            note: sourceConflict
                ? 'Credible sources disagree on this claim — human editor must resolve the discrepancy.'
                : null,
            provider: name,
            checkedAt: new Date().toISOString(),
        };
    } catch (e) {
        // Network error, abort/timeout, non-JSON body, etc. — never throw out of this module.
        return { claimId: claim.id, claimText, query, status: 'needs_research', sourceConflict: false, sources: [], note: 'Research provider was unreachable or timed out. Try again later.' };
    }
}

/**
 * Researches the given (already-detected) claims. Returns:
 *   { researchStatus: 'not_configured' | 'completed' | 'partial', results: [claimResult...] }
 * `results` always has one entry per prioritized claim, even on total provider failure — the
 * caller never has to guess which claims were skipped.
 */
async function researchClaims(claims, options = {}) {
    const url = process.env.RESEARCH_PROVIDER_URL || '';
    const key = process.env.RESEARCH_PROVIDER_KEY || '';
    const name = process.env.RESEARCH_PROVIDER_NAME || 'external';
    const jurisdiction = options.jurisdiction ? String(options.jurisdiction).slice(0, 100) : null;

    const prioritized = prioritizeClaims(Array.isArray(claims) ? claims : []);
    const skippedCount = Math.max(0, (Array.isArray(claims) ? claims.length : 0) - prioritized.length);

    const results = await Promise.all(prioritized.map(async (claim) => {
        const key_ = fingerprint(claim, jurisdiction);
        const cached = cache.get(key_);
        if (cached && cached.expiresAt > Date.now()) return cached.result;

        if (inFlight.has(key_)) return inFlight.get(key_);

        const promise = researchOneClaim(claim, { jurisdiction, url, key, name })
            .then((result) => {
                // Only cache a result that actually reflects a successful provider response —
                // never cache a needs_research placeholder (not_configured, error, timeout,
                // malformed response), so a transient provider failure or a later fix/reconfig
                // is retried on the very next check rather than "sticky-failing".
                if (url && key && result.status !== 'needs_research') {
                    cache.set(key_, { result, expiresAt: Date.now() + CACHE_TTL_MS });
                }
                inFlight.delete(key_);
                return result;
            })
            .catch(() => {
                inFlight.delete(key_);
                return { claimId: claim.id, claimText: claim.text, query: buildResearchQuery(claim), status: 'needs_research', sourceConflict: false, sources: [], note: 'Research failed unexpectedly.' };
            });
        inFlight.set(key_, promise);
        return promise;
    }));

    return {
        researchStatus: url && key ? 'completed' : 'not_configured',
        provider: url && key ? name : null,
        results,
        skippedCount,
    };
}

module.exports = {
    researchClaims,
    isConfigured,
    prioritizeClaims,
    deriveEvidence,
    isValidSource,
    normalizeSource,
    fingerprint,
    CACHE_TTL_MS,
    MAX_CLAIMS_PER_REQUEST,
};
