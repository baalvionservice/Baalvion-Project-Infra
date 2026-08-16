'use strict';
// OAuth-style `client_credentials` grant for unattended machine callers (scheduled jobs,
// bots) — mints a canonical token WITHOUT a password, the way issueOnBehalf.js does, except
// trust comes from a hashed client_secret instead of an already-established upstream session.
//
// Deliberately narrow: the resulting token carries roles:[]/permissions:[] — this path grants
// NO platform-level authority. Whatever the caller can actually do is entirely determined by
// real, auditable resource memberships tied to the linked service-account user (e.g. a
// cms.website_members row), the same as it would be for a human. A client is only ever as
// powerful as the resource memberships explicitly granted to its linked user — nothing here
// widens that.
const db = require('../models');
const { userRepo, sessionRepo, auditRepo } = require('../repositories');
const password = require('../utils/password');
const jwt = require('../utils/jwtRsa');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

async function clientCredentialsGrant({ clientId, clientSecret, ipAddress, userAgent }) {
    const [client] = await db.sequelize.query(
        `SELECT id, client_id, client_secret_hash, grant_types, owner_id, org_id, revoked_at
         FROM auth.oauth_clients WHERE client_id = $1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [clientId] },
    );
    if (!client || client.revoked_at) throw new AppError('INVALID_CLIENT', 'Unknown or revoked client', 401);

    const grantTypes = typeof client.grant_types === 'string' ? JSON.parse(client.grant_types) : client.grant_types;
    if (!Array.isArray(grantTypes) || !grantTypes.includes('client_credentials')) {
        throw new AppError('UNAUTHORIZED_CLIENT', 'This client is not authorized for client_credentials', 401);
    }
    if (!client.client_secret_hash || !(await password.verify(client.client_secret_hash, clientSecret))) {
        throw new AppError('INVALID_CLIENT', 'Invalid client credentials', 401);
    }
    if (!client.owner_id || !client.org_id) {
        throw new AppError('INVALID_CLIENT', 'Client is not linked to a service-account user/org', 500);
    }

    const user = await userRepo.findById(client.owner_id);
    if (!user || (user.status && user.status !== 'active')) {
        throw new AppError('ACCOUNT_DISABLED', 'Linked service-account user is not active', 403);
    }

    // A real, revocable session — same mechanism as a human login, so this credential can be
    // killed independently (DELETE /v1/auth/sessions/:sessionId) without touching the client row.
    const session = await sessionRepo.create({ userId: user.id, orgId: client.org_id, ipAddress, userAgent });

    const accessToken = jwt.signAccessToken({
        sub: user.id,
        email: user.email,
        orgId: client.org_id,
        role: null,
        roles: [],
        permissions: [],
        sid: session.id,
        client_id: client.client_id,
    });

    await auditRepo.append({
        userId: user.id, orgId: client.org_id, action: 'auth.client_credentials_issued',
        metadata: { clientId: client.client_id }, ipAddress,
    });

    return { accessToken, tokenType: 'Bearer', expiresIn: config.jwt.accessExpiresIn };
}

module.exports = { clientCredentialsGrant };
