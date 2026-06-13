'use strict';
const { isStoreStaff } = require('../middleware/rbacPep');
const { verify } = require('./sessionToken');

// Builds the per-request actor used for ownership enforcement.
//   - userId:    authenticated identity (JWT sub) — the source of truth for customer ownership.
//   - sessionId: the guest session recovered from the SIGNED `X-Cart-Session` header (null if the
//                header is absent or the signature is invalid/forged) — the source of truth for
//                anonymous (guest) cart ownership. Never trusts a client-supplied raw session id.
//   - isStaff(): lazy + memoized RBAC store-capability check — only resolved when ownership fails,
//                so the common owner path performs zero RBAC calls.
function actorOf(req) {
    let staffPromise;
    const token = req.get && req.get('X-Cart-Session');
    return {
        userId: req.auth ? req.auth.userId : null,
        sessionId: token ? verify(token) : null,
        requestId: req.requestId,
        isStaff: () => (staffPromise = staffPromise || isStoreStaff(req)),
    };
}

module.exports = { actorOf };
