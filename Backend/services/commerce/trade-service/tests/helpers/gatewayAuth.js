'use strict';
// Signs v1 gateway-bridge headers (bffBridge.js) for tests — the only auth path
// authMiddleware currently accepts (direct bearer tokens are rejected).
const crypto = require('crypto');

function gatewayHeaders({ userId, orgId, roles = [] }) {
    const secret = process.env.GATEWAY_SIGNING_SECRET || '';
    const sig = crypto.createHmac('sha256', secret).update(`${userId}.${orgId}.${roles.join(',')}`).digest('hex');
    return {
        'x-user-id': String(userId),
        'x-org-id': orgId || '',
        'x-roles': JSON.stringify(roles),
        'x-gateway-signature': sig,
    };
}

module.exports = { gatewayHeaders };
