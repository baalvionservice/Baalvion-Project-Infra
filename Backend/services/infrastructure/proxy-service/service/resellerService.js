'use strict';

/**
 * Reseller platform — reseller organizations, the master→sub→customer hierarchy,
 * customer assignment, cascading quotas, and tenant-isolated scope resolution.
 * Hierarchy math (chain resolution, subtree aggregation, cascading quota
 * validation) is PURE and unit-tested; the async layer is reseller CRUD + scope.
 *
 * Isolation: a reseller may only see/act on its own subtree (its sub-resellers +
 * their customers). resolveScope() returns that allow-set for query filtering.
 */

const db = require('../models');
const complianceAudit = require('./complianceAudit');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

// ── pure hierarchy math ─────────────────────────────────────────────────────

/** Walk parent links from a reseller up to the master root. Returns [self,...,root]. */
function resolveChain(resellerId, byId) {
  const chain = [];
  const seen = new Set();
  let cur = byId[resellerId];
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.push(cur);
    cur = cur.parentResellerId ? byId[cur.parentResellerId] : null;
  }
  return chain;
}

/** Collect a reseller's entire subtree (itself + all descendants). */
function subtree(rootId, childrenByParent) {
  const out = [];
  const stack = [rootId];
  const seen = new Set();
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    for (const child of childrenByParent[id] || []) stack.push(child);
  }
  return out;
}

/**
 * Validate a cascading quota allocation: the sum a parent allocates to its
 * children (+ direct customers) must not exceed the parent's own quota.
 * @returns {{ok, allocated, available, overBy}}
 */
function cascadeQuotaCheck(parentQuota, childAllocations = []) {
  if (parentQuota == null) return { ok: true, allocated: sum(childAllocations), available: Infinity, overBy: 0 }; // unlimited
  const allocated = sum(childAllocations);
  const overBy = Math.max(0, allocated - Number(parentQuota));
  return { ok: overBy === 0, allocated, available: Math.max(0, Number(parentQuota) - allocated), overBy };
}

/** Aggregate metrics over a subtree (revenue, customers, gb). */
function aggregateSubtree(subtreeIds, metricsById) {
  return subtreeIds.reduce((acc, id) => {
    const m = metricsById[id] || {};
    acc.customers += Number(m.customers || 0);
    acc.revenue += Number(m.revenue || 0);
    acc.gb += Number(m.gb || 0);
    return acc;
  }, { customers: 0, revenue: 0, gb: 0 });
}

function sum(xs) { return xs.reduce((s, v) => s + (Number(v) || 0), 0); }

// ── async CRUD + scope ──────────────────────────────────────────────────────

async function createReseller({ orgId, parentResellerId = null, tier = 'reseller', marginPct = 0, wholesaleDiscount = 0, quotaGb = null, actorId }) {
  // Sub-reseller margin cannot exceed the parent's available margin (real constraint).
  if (parentResellerId) {
    const [parent] = await db.sequelize.query(`SELECT margin_pct FROM reseller_orgs WHERE id = :id`, { replacements: { id: parentResellerId }, type: Q.SELECT });
    if (parent && Number(marginPct) > Number(parent.margin_pct)) {
      throw new Error('sub-reseller margin exceeds parent margin');
    }
  }
  const [row] = await db.sequelize.query(
    `INSERT INTO reseller_orgs (org_id, parent_reseller_id, tier, margin_pct, wholesale_discount, quota_gb, status)
     VALUES (:org, :parent, :tier, :margin, :wholesale, :quota, 'pending') RETURNING id`,
    { replacements: { org: orgId, parent: parentResellerId, tier, margin: marginPct, wholesale: wholesaleDiscount, quota: quotaGb }, type: Q.SELECT },
  );
  await complianceAudit.log({ domain: 'access', action: 'reseller.create', orgId, actorId, payload: { resellerId: row.id, tier } }).catch(() => {});
  return { id: row.id, status: 'pending' };
}

async function getByOrg(orgId) {
  const [r] = await db.sequelize.query(`SELECT * FROM reseller_orgs WHERE org_id = :org`, { replacements: { org: orgId }, type: Q.SELECT });
  return r || null;
}

async function loadAll() {
  return db.sequelize.query(`SELECT id, org_id, parent_reseller_id, tier, status, margin_pct, quota_gb FROM reseller_orgs`, { type: Q.SELECT });
}

/** The set of reseller ids this reseller may act on (its subtree). Tenant isolation. */
async function resolveScope(resellerId) {
  const all = await loadAll();
  const childrenByParent = {};
  for (const r of all) {
    const p = r.parent_reseller_id;
    if (p) (childrenByParent[p] ??= []).push(r.id);
  }
  return subtree(resellerId, childrenByParent);
}

/** Assign a customer org to a reseller, enforcing the cascading quota. */
async function assignCustomer({ resellerId, customerOrgId, quotaGb = null, customPricing = {}, actorId }) {
  const [reseller] = await db.sequelize.query(`SELECT quota_gb FROM reseller_orgs WHERE id = :id`, { replacements: { id: resellerId }, type: Q.SELECT });
  if (reseller && reseller.quota_gb != null && quotaGb != null) {
    const [used] = await db.sequelize.query(
      `SELECT COALESCE(SUM(quota_gb),0) AS allocated FROM reseller_customers WHERE reseller_id = :id AND status = 'active'`,
      { replacements: { id: resellerId }, type: Q.SELECT },
    );
    const check = cascadeQuotaCheck(Number(reseller.quota_gb), [Number(used.allocated), Number(quotaGb)]);
    if (!check.ok) throw new Error(`quota allocation exceeds reseller quota by ${check.overBy} GB`);
  }
  await db.sequelize.query(
    `INSERT INTO reseller_customers (reseller_id, customer_org_id, quota_gb, custom_pricing)
     VALUES (:r, :c, :q, :cp::jsonb)
     ON CONFLICT (customer_org_id) DO UPDATE SET reseller_id=EXCLUDED.reseller_id, quota_gb=EXCLUDED.quota_gb, custom_pricing=EXCLUDED.custom_pricing`,
    { replacements: { r: resellerId, c: customerOrgId, q: quotaGb, cp: JSON.stringify(customPricing) }, type: Q.INSERT },
  );
  await complianceAudit.log({ domain: 'access', action: 'reseller.assign_customer', orgId: customerOrgId, actorId, payload: { resellerId } }).catch(() => {});
  return { resellerId, customerOrgId };
}

/** Build the customer→root reseller chain with margin pcts (for revenue split). */
async function customerCommissionChain(customerOrgId) {
  const [link] = await db.sequelize.query(`SELECT reseller_id FROM reseller_customers WHERE customer_org_id = :c AND status = 'active'`, { replacements: { c: customerOrgId }, type: Q.SELECT });
  if (!link) return [];
  const all = await loadAll();
  const byId = {};
  for (const r of all) byId[r.id] = { id: r.id, parentResellerId: r.parent_reseller_id, tier: r.tier, marginPct: Number(r.margin_pct) };
  return resolveChain(link.reseller_id, byId).map((r) => ({ partyId: r.id, tier: r.tier, marginPct: r.marginPct }));
}

async function setStatus(resellerId, status, actorId) {
  await db.sequelize.query(`UPDATE reseller_orgs SET status = :s WHERE id = :id`, { replacements: { id: resellerId, s: status }, type: Q.UPDATE });
  await complianceAudit.log({ domain: 'access', action: `reseller.${status}`, actorId, payload: { resellerId } }).catch(() => {});
  return { resellerId, status };
}

module.exports = {
  resolveChain, subtree, cascadeQuotaCheck, aggregateSubtree,
  createReseller, getByOrg, loadAll, resolveScope, assignCustomer, customerCommissionChain, setStatus,
};
