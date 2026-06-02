'use strict';
// Factory for the RBAC-service HTTP client (the single source of truth for the admin
// hierarchy + store-team roles). Shared by every commerce service.
//   - DECISION/RESOLUTION + MANAGEMENT calls forward the CALLER's bearer token so RBAC enforces
//     requireScopeAdmin/requireTenantAdmin against the real user.
//   - SYSTEM-context calls use the X-Internal-Key service key ONLY when { internal: true } is
//     explicit — never as a silent fallback for a missing token (privilege-escalation guard).
// Uses Node's global fetch (Node >=18). No new issuer, no HMAC.
const { makeErrorFactory } = require('./errors');

/**
 * @param {object} cfg
 * @param {string} cfg.baseUrl           e.g. http://localhost:3055
 * @param {string} [cfg.apiPrefix='/v1']
 * @param {number} [cfg.timeoutMs=4000]
 * @param {string} [cfg.internalApiKey]  optional service key (X-Internal-Key)
 * @param {function} [cfg.AppError]      consuming service's error class (recommended)
 * @param {function} [cfg.fetchImpl]     override fetch (tests)
 */
function createRbacClient(cfg = {}) {
    const apiPrefix = cfg.apiPrefix || '/v1';
    const timeoutMs = Number(cfg.timeoutMs || 4000);
    const internalApiKey = cfg.internalApiKey || '';
    const error = makeErrorFactory(cfg.AppError);
    const FETCH = cfg.fetchImpl || globalThis.fetch;
    const BASE = () => `${cfg.baseUrl}${apiPrefix}`;

    function authHeaders({ token, internal } = {}) {
        const headers = { 'Content-Type': 'application/json' };
        if (internal) {
            if (!internalApiKey) throw error('RBAC_NO_SERVICE_KEY', 'Internal RBAC call requested but no service key is configured', 500);
            headers['X-Internal-Key'] = internalApiKey;
            return headers;
        }
        if (token) headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        // No token + not internal → no auth header → RBAC rejects (401). Fail-closed.
        return headers;
    }

    async function request(method, path, { token, internal, body } = {}) {
        if (typeof FETCH !== 'function') throw error('RBAC_UNAVAILABLE', 'global fetch is unavailable (Node >=18 required)', 503);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        let res;
        try {
            res = await FETCH(`${BASE()}${path}`, {
                method,
                headers: authHeaders({ token, internal }),
                body: body !== undefined ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
        } catch (err) {
            throw error('RBAC_UNAVAILABLE', `RBAC request failed: ${err.name === 'AbortError' ? 'timeout' : err.message}`, 503);
        } finally {
            clearTimeout(timer);
        }

        let payload = null;
        const text = await res.text();
        if (text) { try { payload = JSON.parse(text); } catch { payload = { raw: text }; } }

        if (!res.ok) {
            const code = (payload && (payload.error?.code || payload.code)) || 'RBAC_ERROR';
            const message = (payload && (payload.error?.message || payload.message)) || `RBAC responded ${res.status}`;
            throw error(String(code).toUpperCase(), message, res.status); // preserve RBAC's status (e.g. 403)
        }
        return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
    }

    const qs = (query) => {
        const s = new URLSearchParams(Object.entries(query).filter(([, v]) => v != null)).toString();
        return s ? `?${s}` : '';
    };

    return {
        request,
        getUserEffective: (userId, opts = {}) => request('GET', `/users/${encodeURIComponent(String(userId))}/effective`, opts),
        authorize: (decisionRequest, opts = {}) => request('POST', '/authorize', { ...opts, body: decisionRequest }),
        listTenants: (query = {}, opts = {}) => request('GET', `/tenants${qs(query)}`, opts),
        getTenant: (id, opts = {}) => request('GET', `/tenants/${encodeURIComponent(id)}`, opts),
        createTenant: (body, opts = {}) => request('POST', '/tenants', { ...opts, body }),
        listRoles: (query = {}, opts = {}) => request('GET', `/roles${qs(query)}`, opts),
        createRole: (body, opts = {}) => request('POST', '/roles', { ...opts, body }),
        listPermissions: (opts = {}) => request('GET', '/permissions', opts),
        createPermission: (body, opts = {}) => request('POST', '/permissions', { ...opts, body }),
        attachPermission: (roleId, body, opts = {}) => request('POST', `/roles/${encodeURIComponent(roleId)}/permissions`, { ...opts, body }),
        listAssignments: (query = {}, opts = {}) => request('GET', `/assignments${qs(query)}`, opts),
        assignRole: (body, opts = {}) => request('POST', '/assignments', { ...opts, body }),
        revokeAssignment: (id, opts = {}) => request('DELETE', `/assignments/${encodeURIComponent(id)}`, opts),
    };
}

module.exports = { createRbacClient };
