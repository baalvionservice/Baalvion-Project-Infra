'use strict';
// Thin wrapper around NodeBB's admin-issued Write API (nodebb-plugin-write-api). This is the
// SINGLE place NodeBB's actual endpoint shapes are encoded — isolate that risk here rather
// than scattering fetch() calls through membershipService.
//
// ⚠ VERIFY AT EXECUTION TIME: the exact request/response shapes below follow the
// nodebb-plugin-write-api's documented conventions (REST-ish, /api/v1/* base, group
// membership as a PUT/DELETE sub-resource), but the plugin's endpoint shapes have shifted
// across NodeBB major versions. Confirm against the installed plugin version's own
// /api/v1 docs (NodeBB admin panel exposes this) before relying on these in production —
// see deploy/consolidated/nodebb/bootstrap/seed-categories.js for the same caveat.
const config = require('../config/appConfig');

const BASE = config.nodebb.baseUrl;
const TOKEN = config.nodebb.writeApiToken;

class NodeBBError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

async function nbFetch(path, options = {}) {
    if (!TOKEN) throw new NodeBBError('NODEBB_WRITE_API_TOKEN not configured', 500);
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${TOKEN}`,
            ...(options.headers || {}),
        },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new NodeBBError(body.status?.message || `NodeBB request failed (${res.status})`, res.status);
    return body;
}

// Adds a NodeBB user to a group by slug — this is what actually grants read/post access to
// whatever category that group is privileged on (set up in seed-categories.js).
async function addUserToGroup(nodebbUid, groupSlug) {
    if (!nodebbUid || !groupSlug) return;
    return nbFetch(`/api/v1/groups/${encodeURIComponent(groupSlug)}/membership/${encodeURIComponent(nodebbUid)}`, {
        method: 'PUT',
    });
}

async function removeUserFromGroup(nodebbUid, groupSlug) {
    if (!nodebbUid || !groupSlug) return;
    return nbFetch(`/api/v1/groups/${encodeURIComponent(groupSlug)}/membership/${encodeURIComponent(nodebbUid)}`, {
        method: 'DELETE',
    });
}

async function createCategory(payload) {
    return nbFetch('/api/v1/categories', { method: 'POST', body: JSON.stringify(payload) });
}

async function getCategoryTopics(cid) {
    return nbFetch(`/api/v1/categories/${encodeURIComponent(cid)}/topics`, { method: 'GET' });
}

async function getTopic(tid) {
    return nbFetch(`/api/v1/topics/${encodeURIComponent(tid)}`, { method: 'GET' });
}

// community-service's own membership rows are keyed by the platform's gateway userId (UUID),
// not NodeBB's internal numeric uid. Since the two identities are linked only via the SSO
// plugin (oauth2-multiple), the reliable bridge available to a server-to-server caller is
// looking the NodeBB account up by the same email address the gateway session carries.
// ⚠ VERIFY AT EXECUTION TIME: confirm the installed NodeBB version's exact "find user by
// email" route (core has historically exposed this at /api/user/email/:email — NOT under
// /api/v1 — differs from the write-api's own /api/v1/* namespace used above).
async function resolveUidByEmail(email) {
    if (!email) return null;
    try {
        const body = await nbFetch(`/api/user/email/${encodeURIComponent(email)}`, { method: 'GET' });
        return body && (body.uid || body.data?.uid) || null;
    } catch {
        return null;
    }
}

// Posting on behalf of a resolved platform user. NodeBB's write-api allows a privileged
// (admin-token) caller to specify `_uid` so the resulting content is correctly attributed
// to the acting user rather than the service account — this is what makes it safe for
// community-service to be the ONLY thing that ever calls NodeBB's write surface: the
// caller's identity has already been through real RS256 verification (authMiddleware) and
// a requireCommunityRole('member') gate before nodebbClient is ever invoked (see
// controller/contentController.js) — the frontend never gets a NodeBB credential of its own.
async function createTopic(cid, uid, title, content) {
    return nbFetch('/api/v1/topics', { method: 'POST', body: JSON.stringify({ cid, uid, title, content }) });
}

async function createReply(tid, uid, content) {
    return nbFetch(`/api/v1/topics/${encodeURIComponent(tid)}`, { method: 'POST', body: JSON.stringify({ uid, content }) });
}

module.exports = {
    addUserToGroup,
    removeUserFromGroup,
    createCategory,
    getCategoryTopics,
    getTopic,
    resolveUidByEmail,
    createTopic,
    createReply,
    NodeBBError,
};
