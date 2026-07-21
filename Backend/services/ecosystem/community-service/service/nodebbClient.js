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

// Reported-content review (nodebb-plugin-write-api's flags sub-resource). NodeBB dedupes
// flags per (type, target) internally, so this surfaces one row per reported post/topic with
// its own reporter history rather than one row per report.
// ⚠ VERIFY AT EXECUTION TIME: same caveat as every other endpoint in this file — confirm
// /api/v1/flags' exact shape (in particular whether the installed version nests the flagged
// post's category cid at flag.target.category.cid or elsewhere) against the live instance.
async function getFlags() {
    const body = await nbFetch('/api/v1/flags', { method: 'GET' });
    return body?.response?.flags || body?.flags || [];
}

async function updateFlagState(flagId, state) {
    return nbFetch(`/api/v1/flags/${encodeURIComponent(flagId)}`, { method: 'PUT', body: JSON.stringify({ state }) });
}

async function deletePost(pid) {
    return nbFetch(`/api/v1/posts/${encodeURIComponent(pid)}`, { method: 'DELETE' });
}

// Edit an existing post's content. Same privileged-caller shape as createReply — community-service
// resolves + verifies the acting uid actually owns pid BEFORE calling this (see
// contentController.editPost); NodeBB's write-api token is admin-level and will not reject an
// ownership mismatch on its own, so that check must happen on our side.
// ⚠ VERIFY AT EXECUTION TIME: same caveat as every other endpoint in this file.
function editPost(pid, uid, content) {
    return nbFetch(`/api/v1/posts/${encodeURIComponent(pid)}`, { method: 'PUT', body: JSON.stringify({ uid, content }) });
}

// Report a post for moderator review — feeds the SAME /api/v1/flags queue
// adminController.js's getFlags/resolveFlag already reads (previously nothing ever wrote to it).
// ⚠ VERIFY AT EXECUTION TIME: nodebb-plugin-write-api documents this as POST /api/v1/posts/:pid/flag
// with a `reason` field; confirm against the installed plugin version before relying on it.
function createFlag(pid, uid, reason) {
    return nbFetch(`/api/v1/posts/${encodeURIComponent(pid)}/flag`, { method: 'POST', body: JSON.stringify({ uid, reason }) });
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
    getFlags,
    updateFlagState,
    deletePost,
    editPost,
    createFlag,
    NodeBBError,
};
