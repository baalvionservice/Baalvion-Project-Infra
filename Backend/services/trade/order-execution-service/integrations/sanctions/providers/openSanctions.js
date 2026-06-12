'use strict';
/**
 * ============================================================================
 * OpenSanctions / yente sanctions-screening provider (REAL, FAIL-CLOSED).
 * ============================================================================
 * Backend: yente — the open-source matching API in front of the OpenSanctions
 * consolidated dataset (real OFAC SDN + EU + UN + UK HMT + many more). yente is
 * self-hostable with NO commercial license; the same wire protocol also serves
 * the hosted api.opensanctions.org (which DOES need an API key for production
 * use of the licensed datasets).
 *
 *   Self-host:  docker run -p 8000:8000 ghcr.io/opensanctions/yente:latest
 *               (+ an Elasticsearch/OpenSearch backing store per yente docs)
 *   Hosted:     https://api.opensanctions.org  (set OPENSANCTIONS_API_KEY)
 *
 * Matching endpoint (yente >= 3.x):
 *   POST {base}/match/{dataset}
 *   body: { "queries": { "q": { "schema": "<Schema>", "properties": {...} } } }
 *   resp: { "responses": { "q": { "results": [ { score, caption, id,
 *           datasets, properties, ... } ] } } }
 *
 * POSTURE: FAIL-CLOSED. On timeout / non-2xx / network error we THROW (the
 * shared httpClient's IntegrationTimeoutError / IntegrationHttpError bubble up).
 * We NEVER return CLEAR on an error — the caller (counterpartyScreening.js +
 * screeningPolicy.decide) treats the thrown error as SCREENING_UNAVAILABLE and
 * BLOCKS the order. Only an explicit empty-results / low-score response from a
 * real, reachable dataset yields CLEAR.
 *
 * Required / optional configuration (env — NEVER hardcode):
 *   YENTE_BASE_URL                 (required) e.g. http://yente:8000
 *   OPENSANCTIONS_API_KEY          (optional) only for hosted api.opensanctions.org
 *   SANCTIONS_DATASET              (default 'default') e.g. 'sanctions'
 *   SANCTIONS_CONFIRM_THRESHOLD    (default 0.85) score >= => CONFIRMED_MATCH
 *   SANCTIONS_POTENTIAL_THRESHOLD  (default 0.60) score >= => POTENTIAL_MATCH
 *   SANCTIONS_TIMEOUT_MS           (default 5000) per-attempt hard timeout
 *   SANCTIONS_MAX_MATCHES          (default 10)  cap on returned match detail
 *   SANCTIONS_RETRIES              (default 1)   transient 5xx/timeout retries (read is safe)
 */

const httpClient = require('../../_shared/httpClient');
const { env, parseHttpUrl } = require('../../_shared/config');
const { IntegrationRequiredError } = require('../../IntegrationRequiredError');
const { SCREENING_STATUS } = require('../contract');

const DEFAULTS = Object.freeze({
    DATASET: 'default',
    CONFIRM_THRESHOLD: 0.85,
    POTENTIAL_THRESHOLD: 0.6,
    TIMEOUT_MS: 5000,
    MAX_MATCHES: 10,
    RETRIES: 1,
});

/** yente schemas. Default to a broad entity schema; allow a Person hint. */
const SCHEMA = Object.freeze({
    PERSON: 'Person',
    LEGAL_ENTITY: 'LegalEntity',
    COMPANY: 'Company',
});

/**
 * Resolve numeric config from env with a default, validating it parses to a
 * finite number (fail loud on a garbage env rather than silently mis-screen).
 */
function num(source, name, fallback) {
    const raw = env(name, source);
    if (raw === undefined) return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n)) {
        throw new Error(`invalid numeric config ${name}=${raw}`);
    }
    return n;
}

/**
 * Build the immutable, validated config for a single screen() call. Reads from
 * the injected env source so tests can drive thresholds without touching
 * process.env. Throws if YENTE_BASE_URL is absent (handled by the adapter as a
 * fail-closed IntegrationRequiredError).
 *
 * @param {NodeJS.ProcessEnv} source
 */
function resolveConfig(source) {
    const baseUrl = env('YENTE_BASE_URL', source);
    if (!baseUrl) {
        const err = new Error('YENTE_BASE_URL not configured');
        err.code = 'YENTE_NOT_CONFIGURED';
        throw err;
    }
    // SSRF / mis-config guard: YENTE_BASE_URL must parse as an http/https URL.
    // A self-hosted internal host is legitimate, so we DON'T host-lock — but an
    // unparseable / non-http(s) value fails CLOSED (we never screen against a
    // bad endpoint and silently risk a fake CLEAR).
    try {
        parseHttpUrl(baseUrl);
    } catch (err) {
        throw new IntegrationRequiredError(
            `YENTE_BASE_URL is not a valid http(s) URL: ${err.message}`,
            { domain: 'sanctions', vendorOptions: ['OpenSanctions/yente'], cause: err },
        );
    }
    const confirm = num(source, 'SANCTIONS_CONFIRM_THRESHOLD', DEFAULTS.CONFIRM_THRESHOLD);
    const potential = num(source, 'SANCTIONS_POTENTIAL_THRESHOLD', DEFAULTS.POTENTIAL_THRESHOLD);
    return Object.freeze({
        baseUrl: baseUrl.replace(/\/+$/, ''),
        apiKey: env('OPENSANCTIONS_API_KEY', source),
        dataset: env('SANCTIONS_DATASET', source) || DEFAULTS.DATASET,
        confirmThreshold: confirm,
        potentialThreshold: potential,
        timeoutMs: num(source, 'SANCTIONS_TIMEOUT_MS', DEFAULTS.TIMEOUT_MS),
        maxMatches: num(source, 'SANCTIONS_MAX_MATCHES', DEFAULTS.MAX_MATCHES),
        retries: num(source, 'SANCTIONS_RETRIES', DEFAULTS.RETRIES),
    });
}

/** True when this provider can operate (base URL present). */
function isConfigured(source = process.env) {
    return env('YENTE_BASE_URL', source) !== undefined;
}

/**
 * Pick the yente schema for a request. Caller may hint `schema` directly, or
 * `entityType: 'individual' | 'person'` to screen a natural person. Defaults to
 * LegalEntity (the broadest schema that still matches companies/orgs).
 */
function resolveSchema(req) {
    const hint = req && (req.schema || req.entityType);
    if (!hint) return SCHEMA.LEGAL_ENTITY;
    const h = String(hint).toLowerCase();
    if (h === 'person' || h === 'individual') return SCHEMA.PERSON;
    if (h === 'company') return SCHEMA.COMPANY;
    if (Object.values(SCHEMA).map((s) => s.toLowerCase()).includes(h)) {
        // exact schema name passed through (case-insensitive)
        return Object.values(SCHEMA).find((s) => s.toLowerCase() === h);
    }
    return SCHEMA.LEGAL_ENTITY;
}

/** Map a top score to the normalized screening status. */
function statusForScore(score, cfg) {
    if (score >= cfg.confirmThreshold) return SCREENING_STATUS.CONFIRMED_MATCH;
    if (score >= cfg.potentialThreshold) return SCREENING_STATUS.POTENTIAL_MATCH;
    return SCREENING_STATUS.CLEAR;
}

/** Derive a human list name from a yente result's datasets[]. */
function listNameFor(result) {
    const ds = result && Array.isArray(result.datasets) ? result.datasets : [];
    return (ds.length && String(ds[0])) || 'OpenSanctions';
}

/** Map one yente result to a contract SanctionsMatch. */
function toMatch(result) {
    const score = Number(result && result.score);
    return {
        listName: listNameFor(result),
        matchedName: (result && result.caption) || '',
        score: Number.isFinite(score) ? score : 0,
        entityId: (result && result.id) || undefined,
    };
}

/**
 * Build the yente /match request body for a single named query.
 * @param {{name:string,country?:string}} req
 * @param {string} schema
 */
function buildBody(req, schema) {
    const properties = { name: [req.name] };
    if (req && req.country) {
        properties.country = [req.country];
    }
    return JSON.stringify({ queries: { q: { schema, properties } } });
}

/**
 * Screen one party against yente / OpenSanctions. FAIL-CLOSED: any transport or
 * HTTP error THROWS (never CLEAR). A reachable dataset that returns no/low-score
 * results yields CLEAR with confidence 0.
 *
 * @param {{name:string,country?:string,tenantId?:string,schema?:string,entityType?:string}} req
 * @param {{ http?: typeof httpClient, env?: NodeJS.ProcessEnv }} [deps]
 * @returns {Promise<import('../contract').ScreenResult>}
 */
async function screen(req, deps = {}) {
    if (!req || typeof req.name !== 'string' || req.name.trim() === '') {
        // Input validation at the boundary — a blank name is a caller bug, not CLEAR.
        const err = new Error('sanctions screen requires a non-empty name');
        err.code = 'INVALID_SCREEN_REQUEST';
        throw err;
    }

    const http = deps.http || httpClient;
    const source = deps.env || process.env;
    const cfg = resolveConfig(source);
    const schema = resolveSchema(req);

    const headers = {
        'content-type': 'application/json',
        accept: 'application/json',
    };
    if (cfg.apiKey) {
        // Hosted api.opensanctions.org accepts an ApiKey-scheme Authorization header.
        headers.authorization = `ApiKey ${cfg.apiKey}`;
    }
    if (req.tenantId) {
        // Forwarded for the provider/audit trail; harmless to self-hosted yente.
        headers['x-tenant-id'] = req.tenantId;
    }

    const url = `${cfg.baseUrl}/match/${encodeURIComponent(cfg.dataset)}`;

    // Reads are idempotent — safe to retry transient 5xx/timeout. THROWS on
    // exhausted retries / non-retriable error (fail-closed).
    const res = await http.request({
        url,
        method: 'POST',
        headers,
        body: buildBody(req, schema),
        timeoutMs: cfg.timeoutMs,
        retries: cfg.retries,
        parseJson: true,
    });

    return mapResponse(res.json, cfg);
}

/**
 * Map a parsed yente /match response into the normalized ScreenResult.
 * Tolerant of a missing query key, but a structurally-absent `responses` object
 * (i.e. the upstream gave us a 2xx with garbage) is treated as unavailable and
 * THROWS — we must not infer CLEAR from a malformed body.
 */
function mapResponse(json, cfg) {
    if (!json || typeof json !== 'object' || !json.responses || typeof json.responses !== 'object') {
        const err = new Error('malformed yente /match response (no responses object)');
        err.code = 'YENTE_MALFORMED_RESPONSE';
        throw err;
    }
    const q = json.responses.q || {};
    const results = Array.isArray(q.results) ? q.results : [];

    if (results.length === 0) {
        return { status: SCREENING_STATUS.CLEAR, confidence: 0, matches: [] };
    }

    // yente returns results sorted by score desc, but don't trust ordering.
    const sorted = results
        .map((r) => ({ raw: r, score: Number(r && r.score) }))
        .filter((r) => Number.isFinite(r.score))
        .sort((a, b) => b.score - a.score);

    const topScore = sorted.length ? sorted[0].score : 0;
    const status = statusForScore(topScore, cfg);
    const matches = sorted.slice(0, cfg.maxMatches).map((r) => toMatch(r.raw));

    return { status, confidence: topScore, matches };
}

module.exports = {
    screen,
    isConfigured,
    resolveConfig,
    resolveSchema,
    statusForScore,
    mapResponse,
    buildBody,
    SCHEMA,
    DEFAULTS,
};
