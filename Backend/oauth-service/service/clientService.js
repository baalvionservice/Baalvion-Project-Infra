'use strict';
const bcrypt        = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { AppError }  = require('../utils/errors');
const { generateCode, sha256 } = require('../utils/crypto');
const logger        = require('../utils/logger');

let _db;
function getDb() {
    if (!_db) _db = require('../models');
    return _db;
}

const ALLOWED_GRANT_TYPES = ['authorization_code', 'client_credentials', 'refresh_token'];
const ALLOWED_SCOPES      = ['openid', 'profile', 'email', 'offline_access'];

async function createClient({ name, redirectUris = [], grantTypes, scopes, isConfidential = true, ownerId, orgId }) {
    const db = getDb();

    const clientId = `bvn_${generateCode(18)}`;
    const rawSecret = isConfidential ? generateCode(32) : null;
    const secretHash = rawSecret ? await bcrypt.hash(rawSecret, 10) : null;

    const resolvedGrants = (grantTypes || ['authorization_code', 'refresh_token'])
        .filter(g => ALLOWED_GRANT_TYPES.includes(g));
    const resolvedScopes = (scopes || ['openid', 'profile', 'email'])
        .filter(s => ALLOWED_SCOPES.includes(s));

    const [result] = await db.sequelize.query(
        `INSERT INTO auth.oauth_clients
            (id, name, client_id, client_secret_hash, redirect_uris, grant_types, scopes,
             is_confidential, owner_id, org_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
         RETURNING id, name, client_id, redirect_uris, grant_types, scopes, is_confidential, created_at`,
        {
            type: db.Sequelize.QueryTypes.INSERT,
            bind: [
                uuidv4(), name, clientId, secretHash,
                JSON.stringify(redirectUris), JSON.stringify(resolvedGrants), JSON.stringify(resolvedScopes),
                isConfidential, ownerId, orgId,
            ],
        }
    );

    logger.info({ clientId, ownerId }, 'OAuth client created');
    // Return the raw secret once — it cannot be retrieved again
    return { ...result[0], clientSecret: rawSecret };
}

async function getClientByClientId(clientId) {
    const db = getDb();
    const [client] = await db.sequelize.query(
        `SELECT id, name, client_id, client_secret_hash, redirect_uris, grant_types, scopes,
                is_confidential, owner_id, org_id, revoked_at, created_at
         FROM auth.oauth_clients WHERE client_id = $1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [clientId] }
    );
    return client || null;
}

async function verifyClientSecret(client, secret) {
    if (!client.is_confidential) return true;
    if (!client.client_secret_hash || !secret) return false;
    return bcrypt.compare(secret, client.client_secret_hash);
}

async function listClients(ownerId, { page = 1, limit = 20 } = {}) {
    const db = getDb();
    const offset = (page - 1) * limit;
    const [clients, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT id, name, client_id, redirect_uris, grant_types, scopes, is_confidential, revoked_at, created_at
             FROM auth.oauth_clients WHERE owner_id = $1
             ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [ownerId, limit, offset] }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS count FROM auth.oauth_clients WHERE owner_id = $1`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [ownerId] }
        ),
    ]);
    return { items: clients, total: count, page, limit, hasMore: offset + limit < count };
}

async function rotateClientSecret(clientId, ownerId) {
    const db = getDb();
    const [client] = await db.sequelize.query(
        'SELECT id, owner_id FROM auth.oauth_clients WHERE client_id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [clientId] }
    );
    if (!client) throw new AppError('NOT_FOUND', 'Client not found', 404);
    if (String(client.owner_id) !== String(ownerId)) throw new AppError('FORBIDDEN', 'Access denied', 403);

    const rawSecret  = generateCode(32);
    const secretHash = await bcrypt.hash(rawSecret, 10);
    await db.sequelize.query(
        'UPDATE auth.oauth_clients SET client_secret_hash = $1, updated_at = NOW() WHERE client_id = $2',
        { bind: [secretHash, clientId] }
    );
    return { clientSecret: rawSecret };
}

async function deleteClient(clientId, ownerId) {
    const db = getDb();
    const [client] = await db.sequelize.query(
        'SELECT id, owner_id FROM auth.oauth_clients WHERE client_id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [clientId] }
    );
    if (!client) throw new AppError('NOT_FOUND', 'Client not found', 404);
    if (String(client.owner_id) !== String(ownerId)) throw new AppError('FORBIDDEN', 'Access denied', 403);
    await db.sequelize.query(
        'UPDATE auth.oauth_clients SET revoked_at = NOW(), updated_at = NOW() WHERE client_id = $1',
        { bind: [clientId] }
    );
}

module.exports = { createClient, getClientByClientId, verifyClientSecret, listClients, rotateClientSecret, deleteClient };
