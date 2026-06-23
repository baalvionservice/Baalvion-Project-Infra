'use strict';

/**
 * Custom-domain management. add() issues a DNS TXT verification token; verify()
 * performs a REAL `dns.resolveTxt` lookup and only marks the domain verified when
 * the published record matches (admins may force-verify in non-prod). A verified
 * domain is what brandingService.resolveByDomain() keys off.
 */

const dns = require('node:dns').promises;
const crypto = require('node:crypto');
const db = require('../models');
const config = require('../config/appConfig');
const events = require('./events');
const logger = require('../utils/logger');
const { invalidateForTenant } = require('./brandingService');
const { Errors } = require('../utils/errors');

async function list(tenantId) {
    const rows = await db.TenantDomain.findAll({ where: { tenant_id: tenantId }, order: [['created_at', 'DESC']] });
    return rows.map((r) => r.toJSON());
}

async function add({ tenantId, domain, app = 'default', isPrimary = false }) {
    const d = String(domain || '').toLowerCase().trim();
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(d)) throw Errors.badRequest('Invalid domain');
    const token = `${config.tenant.domainVerifyPrefix}=${crypto.randomBytes(16).toString('hex')}`;
    const existing = await db.TenantDomain.findOne({ where: { domain: d } });
    if (existing && existing.tenant_id !== tenantId) throw Errors.conflict('Domain already claimed by another tenant');
    const [row] = await db.TenantDomain.findOrCreate({
        where: { domain: d },
        defaults: { tenant_id: tenantId, domain: d, app, verify_token: token, is_primary: !!isPrimary },
    });
    if (existing) await row.update({ verify_token: token, app, is_primary: !!isPrimary });
    return {
        id: row.id, domain: d, verifyToken: row.verify_token, verified: row.verified,
        instructions: `Create a DNS TXT record on ${d} (or _baalvion-challenge.${d}) with value: ${row.verify_token}`,
    };
}

// DNS lookup timeout — prevents indefinite hangs on slow/unresponsive resolvers.
const DNS_TIMEOUT_MS = 5000;

async function checkDns(domain, token) {
    const names = [domain, `_baalvion-challenge.${domain}`];
    for (const name of names) {
        try {
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('dns_timeout')), DNS_TIMEOUT_MS)
            );
            const records = await Promise.race([dns.resolveTxt(name), timeout]);
            const flat = records.map((r) => r.join(''));
            if (flat.includes(token)) return true;
        } catch (err) {
            // NXDOMAIN / no record / timeout — expected during verification polling; try next name.
            logger.debug({ err: err.message, name }, '[tenant-service] DNS TXT lookup miss — trying next name');
        }
    }
    return false;
}

async function verify({ id, tenantId, force = false }) {
    const row = await db.TenantDomain.findOne({ where: { id, tenant_id: tenantId } });
    if (!row) throw Errors.notFound('Domain not found');
    if (row.verified) return { id, domain: row.domain, verified: true };

    const matched = force || await checkDns(row.domain, row.verify_token);
    if (!matched) throw Errors.badRequest('DNS TXT record not found yet — add the record and retry', { token: row.verify_token });

    await row.update({ verified: true, cert_status: 'issued', verified_at: new Date() });
    await invalidateForTenant(tenantId);
    await events.publish('tenant.domain_verified', { tenantId, domain: row.domain });
    return { id, domain: row.domain, verified: true, certStatus: 'issued' };
}

async function setPrimary({ id, tenantId }) {
    const row = await db.TenantDomain.findOne({ where: { id, tenant_id: tenantId } });
    if (!row) throw Errors.notFound('Domain not found');
    await db.TenantDomain.update({ is_primary: false }, { where: { tenant_id: tenantId } });
    await row.update({ is_primary: true });
    return { id, domain: row.domain, isPrimary: true };
}

async function remove({ id, tenantId }) {
    const row = await db.TenantDomain.findOne({ where: { id, tenant_id: tenantId } });
    if (!row) throw Errors.notFound('Domain not found');
    await row.destroy();
    await invalidateForTenant(tenantId);
    return { id, deleted: true };
}

module.exports = { list, add, verify, setPrimary, remove, checkDns };
