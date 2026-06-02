'use strict';
const bcrypt = require('bcrypt');
const { generateToken, sha256 } = require('../utils/crypto');

let db = null;
try { db = require('../models'); } catch (_) {}

const nowIso = () => new Date().toISOString();
const dateStr = (v) => !v ? null : (v instanceof Date ? v.toISOString() : v);
const toSnake = (s) => s.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);
// Strip CR/LF/tab from user-derived values before logging (log-injection guard)
const logSafe = (v) => String(v).replace(/[\r\n\t]/g, ' ');
// Keys that must never index a plain object (prototype-pollution guard)
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const isMemory = (name) => !MODEL_MAP[name];
const makeId = (prefix) => `${prefix}_${generateToken(6)}`;

// Collections backed only by in-memory (no DB table)
const mem = {
  sessions: [],
  loginHistory: [],
  rateLimits: [
    { id: 'rl_1', key: 'per-ip', windowMs: 60000, max: 120 },
    { id: 'rl_2', key: 'per-user', windowMs: 60000, max: 240 },
  ],
};

const MODEL_MAP = {
  organizations: 'organizations',
  users: 'users',
  orgMemberships: 'org_memberships',
  proxies: 'proxies',
  proxyLogs: 'proxy_usage_logs',
  presets: 'presets',
  usageHistory: 'usage_records',
  subscriptions: 'subscriptions',
  invoices: 'invoices',
  plans: 'plans',
  paymentMethods: 'payment_methods',
  apiKeys: 'api_keys',
  notifications: 'notifications',
  auditLogs: 'audit_logs',
  supportTickets: 'support_tickets',
  ticketMessages: 'ticket_messages',
  providers: 'providers',
  providerHealth: 'provider_health',
  providerIncidents: 'provider_incidents',
  routingRules: 'routing_rules',
  abuseLogs: 'abuse_logs',
  featureFlags: 'feature_flags',
};

const ORG_COL = {
  users: 'org_id', orgMemberships: 'org_id', proxies: 'org_id',
  proxyLogs: 'org_id', presets: 'org_id', usageHistory: 'org_id',
  subscriptions: 'org_id', invoices: 'org_id', paymentMethods: 'org_id',
  apiKeys: 'org_id', notifications: 'org_id', auditLogs: 'org_id',
  supportTickets: 'org_id', ticketMessages: 'org_id', abuseLogs: 'org_id',
};

const ORG_SCOPED = new Set(Object.keys(ORG_COL).concat(['sessions', 'loginHistory']));

const raw = (instance) => {
  if (!instance) return null;
  if (typeof instance.get === 'function') return instance.get({ plain: true });
  return instance;
};

const convertRecord = (name, inst) => {
  const r = raw(inst);
  if (!r) return null;
  switch (name) {
    case 'plans': return {
      id: String(r.id), name: r.name,
      slug: r.slug || r.name.toLowerCase().replace(/\s+/g, '-'),
      monthlyPrice: parseFloat(r.price || 0),
      bandwidthLimitGb: parseInt(r.bandwidth_limit || 0),
      features: r.features || r.proxy_types_allowed || [],
      enforcementMode: 'pay-as-you-go',
      createdAt: dateStr(r.createdAt), updatedAt: dateStr(r.updatedAt),
    };
    case 'proxies': return {
      id: String(r.id), orgId: r.org_id,
      providerId: r.provider_id ? String(r.provider_id) : null,
      name: r.name || `${r.type || 'proxy'}-${r.country || 'XX'}`,
      host: r.ip ? String(r.ip) : '', ip: r.ip ? String(r.ip) : '',
      port: r.port, username: r.username || 'proxyuser',
      password: r.password || 'proxypass',
      country: r.country, type: r.type, protocol: r.protocol || 'http',
      status: r.status,
      successRate: parseFloat(r.success_rate || 100),
      avgLatency: parseInt(r.latency || 0), latency: parseInt(r.latency || 0),
      bandwidthUsedGb: parseFloat(r.bandwidth_used || 0),
      bandwidthLimitGb: parseFloat(r.bandwidth_limit || 0),
      healthScore: parseFloat(r.health_score || 100),
      createdAt: dateStr(r.createdAt), updatedAt: dateStr(r.updatedAt),
    };
    case 'users': return {
      id: String(r.id), orgId: r.org_id, email: r.email,
      name: r.full_name || r.email.split('@')[0],
      company: r.company || null, timezone: r.timezone || null,
      role: r.role, status: r.status,
      passwordHash: r.password_hash,
      mfaEnabled: !!r.mfa_enabled, mfaSecret: r.mfa_secret,
      emailVerified: !!r.email_verified_at,
      createdAt: dateStr(r.createdAt), updatedAt: dateStr(r.updatedAt),
    };
    case 'organizations': return {
      id: r.id, slug: r.slug, name: r.name, status: r.status,
      planSlug: r.plan_slug || 'starter',
      bandwidthLimitGb: parseInt(r.bandwidth_limit_gb || 0),
      bandwidthUsedGb: parseFloat(r.bandwidth_used_gb || 0),
      createdAt: dateStr(r.createdAt), updatedAt: dateStr(r.updatedAt),
    };
    case 'subscriptions': return {
      id: String(r.id), orgId: r.org_id,
      userId: r.user_id ? String(r.user_id) : null,
      planId: r.plan_id ? String(r.plan_id) : null,
      planSlug: r.plan_slug || 'starter',
      status: r.status,
      enforcementMode: r.enforcement_mode || 'pay-as-you-go',
      currentPeriodStart: dateStr(r.current_period_start),
      currentPeriodEnd: dateStr(r.current_period_end),
      cancelAtPeriodEnd: !!r.cancel_at_period_end,
      stripeCustomerId: r.stripe_customer_id || null,
      stripeSubscriptionId: r.stripe_subscription_id || null,
      createdAt: dateStr(r.createdAt), updatedAt: dateStr(r.updatedAt),
    };
    case 'invoices': return {
      id: String(r.id), orgId: r.org_id,
      subscriptionId: r.subscription_id ? String(r.subscription_id) : null,
      userId: r.user_id ? String(r.user_id) : null,
      amount: parseFloat(r.amount || 0),
      tax: parseFloat(r.tax || 0),
      total: parseFloat(r.total || r.amount || 0),
      status: r.status,
      issuedAt: dateStr(r.issued_at), dueAt: dateStr(r.due_at),
      createdAt: dateStr(r.createdAt),
    };
    case 'notifications': return {
      id: r.id, orgId: r.org_id, title: r.title, body: r.body,
      read: !!r.read_at, readAt: dateStr(r.read_at),
      createdAt: dateStr(r.createdAt),
    };
    case 'usageHistory': return {
      id: r.id, orgId: r.org_id,
      date: r.period_start instanceof Date
        ? r.period_start.toISOString().slice(0, 10)
        : String(r.period_start || '').slice(0, 10),
      bandwidth: parseFloat(r.bandwidth_gb || 0),
      requests: parseInt(r.requests || 0),
      successRate: parseFloat(r.success_rate || 0),
      avgLatency: parseInt(r.avg_latency_ms || 0),
    };
    case 'orgMemberships': return {
      id: r.id, orgId: r.org_id,
      userId: r.user_id ? String(r.user_id) : null,
      role: r.role,
      invitedBy: r.invited_by ? String(r.invited_by) : null,
      status: r.status || 'active',
      createdAt: dateStr(r.createdAt),
    };
    case 'apiKeys': return {
      id: r.id, orgId: r.org_id, name: r.name || 'API Key',
      keyPrefix: r.key_prefix, keyHash: r.key_hash,
      createdBy: r.created_by ? String(r.created_by) : null,
      revokedAt: dateStr(r.revoked_at),
      createdAt: dateStr(r.createdAt),
    };
    case 'featureFlags': return {
      id: r.key, key: r.key,
      name: r.description || r.key,
      description: r.description,
      enabled: !!r.default_value,
      defaultValue: !!r.default_value,
      rolloutPercent: 100,
      plans: r.plans || [],
      conditions: null,
      createdAt: dateStr(r.createdAt),
      updatedAt: dateStr(r.updatedAt),
    };
    case 'auditLogs': return {
      id: String(r.id), orgId: r.org_id,
      actorUserId: r.admin_id ? String(r.admin_id) : null,
      action: r.action, entityType: r.entity_type,
      entityId: r.entity_id ? String(r.entity_id) : null,
      details: r.details || {},
      createdAt: dateStr(r.createdAt),
    };
    case 'supportTickets': return {
      id: r.id, orgId: r.org_id, subject: r.subject,
      status: r.status, priority: r.priority,
      createdAt: dateStr(r.createdAt), updatedAt: dateStr(r.updatedAt),
    };
    case 'ticketMessages': return {
      id: r.id, orgId: r.org_id, ticketId: r.ticket_id,
      authorUserId: r.author_user_id ? String(r.author_user_id) : null,
      message: r.message, createdAt: dateStr(r.createdAt),
    };
    case 'providers': return {
      id: String(r.id), name: r.name,
      type: r.type || 'generic', status: r.status || 'healthy',
      successRate: parseFloat(r.success_rate || 100),
      latency: parseInt(r.latency || 0),
      priority: r.priority || 1,
      healthScore: parseFloat(r.health_score || 100),
      failoverEnabled: !!r.failover_enabled,
      countriesSupported: r.countries_supported || [],
      createdAt: dateStr(r.createdAt),
    };
    case 'providerHealth': return {
      id: r.id,
      providerId: r.provider_id ? String(r.provider_id) : null,
      latency: r.latency_ms || 0,
      successRate: parseFloat(r.success_rate || 100),
      status: r.status || 'healthy',
      createdAt: dateStr(r.createdAt),
    };
    case 'providerIncidents': return {
      id: r.id,
      providerId: r.provider_id ? String(r.provider_id) : null,
      title: r.title, status: r.status || 'open',
      startedAt: dateStr(r.started_at), resolvedAt: dateStr(r.resolved_at),
    };
    case 'routingRules': return {
      id: r.id,
      providerId: r.provider_id ? String(r.provider_id) : null,
      name: r.name, priority: r.priority || 1,
      match: r.match || {}, action: r.action || {},
      createdAt: dateStr(r.createdAt),
    };
    case 'abuseLogs': return {
      id: String(r.id), orgId: r.org_id,
      userId: r.user_id ? String(r.user_id) : null,
      resolved: !!r.resolved, severity: r.severity || 'medium',
      reason: r.reason || r.event_type || '',
      createdAt: dateStr(r.createdAt),
    };
    case 'paymentMethods': return {
      id: String(r.id), orgId: r.org_id,
      type: r.type || r.gateway || 'card',
      brand: r.brand, last4: r.last4, expiry: r.expiry,
      isDefault: !!r.is_default,
      createdAt: dateStr(r.createdAt),
    };
    case 'presets': return {
      id: r.id, orgId: r.org_id, name: r.name,
      type: r.type, country: r.country,
      protocol: r.protocol || 'http',
      rotation: r.rotation || 'rotating',
      createdAt: dateStr(r.created_at || r.createdAt),
      updatedAt: dateStr(r.updated_at || r.updatedAt),
    };
    case 'proxyLogs': return {
      id: String(r.id), orgId: r.org_id,
      proxyId: r.proxy_id ? String(r.proxy_id) : null,
      userId: r.user_id ? String(r.user_id) : null,
      statusCode: r.success ? 200 : 500,
      latency: r.response_time || 0,
      success: r.success, bandwidthUsed: r.bandwidth_used || 0,
      createdAt: dateStr(r.timestamp),
    };
    default: {
      const out = {};
      for (const [k, v] of Object.entries(r)) {
        if (typeof v === 'bigint') out[k] = String(v);
        else if (v instanceof Date) out[k] = v.toISOString();
        else out[k] = v;
      }
      return out;
    }
  }
};

// Convert camelCase payload → snake_case DB columns for insert
const prepareInsert = (name, payload) => {
  const p = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined) continue;
    if (FORBIDDEN_KEYS.has(k)) continue;
    const col = toSnake(k);
    if (FORBIDDEN_KEYS.has(col)) continue;
    // col is user-controlled: only allow plain snake_case column names (no arbitrary property write).
    if (!/^[a-z0-9_]+$/.test(col)) continue;
    p[col] = v;
  }
  if (name === 'proxies') {
    if (p.host !== undefined) { p.ip = p.host; delete p.host; }
    if (p.avg_latency !== undefined) { p.latency = p.avg_latency; delete p.avg_latency; }
    if (p.bandwidth_used_gb !== undefined) { p.bandwidth_used = p.bandwidth_used_gb; delete p.bandwidth_used_gb; }
    if (p.bandwidth_limit_gb !== undefined) { p.bandwidth_limit = p.bandwidth_limit_gb; delete p.bandwidth_limit_gb; }
    delete p.success_rate; delete p.host_name;
  }
  if (name === 'plans') {
    if (p.monthly_price !== undefined) { p.price = p.monthly_price; delete p.monthly_price; }
    if (p.bandwidth_limit_gb !== undefined) { p.bandwidth_limit = p.bandwidth_limit_gb; delete p.bandwidth_limit_gb; }
    if (p.features !== undefined) { p.proxy_types_allowed = p.features; delete p.features; }
    delete p.slug; delete p.enforcement_mode;
  }
  if (name === 'usageHistory') {
    if (p.date !== undefined) { p.period_start = p.date; p.period_end = p.date; delete p.date; }
    if (p.bandwidth !== undefined) { p.bandwidth_gb = p.bandwidth; delete p.bandwidth; }
    if (p.avg_latency !== undefined) { p.avg_latency_ms = p.avg_latency; delete p.avg_latency; }
  }
  if (name === 'auditLogs') {
    if (p.actor_user_id !== undefined) { p.admin_id = parseInt(p.actor_user_id) || 1; delete p.actor_user_id; }
    if (p.entity_id !== undefined) p.entity_id = parseInt(p.entity_id) || 0;
    delete p.details_extra;
  }
  if (name === 'notifications') {
    if (p.read !== undefined) { p.read_at = p.read ? new Date() : null; delete p.read; }
  }
  if (name === 'paymentMethods') {
    if (p.type !== undefined) { p.gateway = p.type; }
  }
  delete p.created_at; delete p.updated_at;
  return p;
};

const prepareUpdate = (name, payload) => {
  const p = prepareInsert(name, payload);
  delete p.id; delete p.org_id; delete p.created_at; delete p.updated_at;
  return p;
};

const getModel = (name) => {
  const modelName = MODEL_MAP[name];
  if (!modelName || !db) return null;
  return db[modelName] || null;
};

const paginate = (items, page = 1, pageSize = 20) => {
  const p = Math.max(1, Number(page) || 1);
  const ps = Math.max(1, Number(pageSize) || 20);
  const start = (p - 1) * ps;
  const data = items.slice(start, start + ps);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / ps));
  return { data, total, page: p, pageSize: ps, totalPages, hasNext: p < totalPages, hasPrev: p > 1 };
};

// ─── DB Migration: add missing columns/tables ─────────────────────────────────
let migrationDone = false;
const runMigrations = async () => {
  // DEPRECATED — runtime DDL removed. Schema is owned by versioned migrations in
  // Backend/migrations (apply with `node migrate.js up`; see migration 017 which
  // folds in everything this function used to ALTER at boot). Performing DDL on
  // application start is a schema-drift hazard under multiple replicas and races
  // with concurrent boots, so it has been intentionally disabled.
  migrationDone = true;
};

// ─── Core CRUD ────────────────────────────────────────────────────────────────
const getCollection = async (name, orgId = null) => {
  // In-memory collections
  if (isMemory(name)) {
    const items = mem[name] || [];
    if (!orgId || !ORG_SCOPED.has(name)) return JSON.parse(JSON.stringify(items));
    return JSON.parse(JSON.stringify(items.filter(i => i.orgId === orgId)));
  }

  const Model = getModel(name);
  if (!Model) return [];

  const where = {};
  const col = ORG_COL[name];
  if (orgId && col) where[col] = orgId;

  const order = name === 'usageHistory'
    ? [['period_start', 'DESC']]
    : name === 'notifications' ? [['created_at', 'DESC']]
    : name === 'auditLogs' ? [['created_at', 'DESC']]
    : [['created_at', 'DESC']];

  try {
    const rows = await Model.findAll({ where, order, raw: false });
    return rows.map(r => convertRecord(name, r));
  } catch (err) {
    console.error(`getCollection(${name}) error:`, err.message);
    return [];
  }
};

const getById = async (name, id, orgId = null) => {
  if (isMemory(name)) {
    const items = mem[name] || [];
    return items.find(i => (i.id === id || i.key === id) && (!orgId || i.orgId === orgId)) || null;
  }

  const Model = getModel(name);
  if (!Model) return null;

  const pk = name === 'featureFlags' ? 'key' : 'id';
  const where = { [pk]: id };
  const col = ORG_COL[name];
  if (orgId && col) where[col] = orgId;

  try {
    const row = await Model.findOne({ where });
    return convertRecord(name, row);
  } catch (err) {
    console.error('getById(%s, %s) error:', logSafe(name), logSafe(id), logSafe(err.message));
    return null;
  }
};

const insert = async (name, payload) => {
  if (isMemory(name)) {
    const item = { id: payload.id || makeId(name.slice(0, 3)), ...payload };
    (mem[name] || (mem[name] = [])).push(item);
    return JSON.parse(JSON.stringify(item));
  }

  const Model = getModel(name);
  if (!Model) throw new Error(`No model for collection: ${name}`);

  const data = prepareInsert(name, payload);
  try {
    const row = await Model.create(data);
    return convertRecord(name, row);
  } catch (err) {
    console.error(`insert(${name}) error:`, err.message, JSON.stringify(data));
    throw err;
  }
};

const update = async (name, id, updater, orgId = null) => {
  if (isMemory(name)) {
    const items = mem[name] || [];
    const target = items.find(i => (i.id === id || i.key === id) && (!orgId || i.orgId === orgId));
    if (!target) return null;
    Object.assign(target, updater, { updatedAt: nowIso() });
    return JSON.parse(JSON.stringify(target));
  }

  const Model = getModel(name);
  if (!Model) return null;

  const pk = name === 'featureFlags' ? 'key' : 'id';
  const where = { [pk]: id };
  const col = ORG_COL[name];
  if (orgId && col) where[col] = orgId;

  const data = prepareUpdate(name, updater);
  if (Object.keys(data).length === 0) {
    return await getById(name, id, orgId);
  }

  try {
    await Model.update(data, { where });
    return await getById(name, id, orgId);
  } catch (err) {
    console.error('update(%s, %s) error:', logSafe(name), logSafe(id), err.message);
    return null;
  }
};

const remove = async (name, id, orgId = null) => {
  if (isMemory(name)) {
    const items = mem[name] || [];
    const idx = items.findIndex(i => (i.id === id || i.key === id) && (!orgId || i.orgId === orgId));
    if (idx === -1) return false;
    items.splice(idx, 1);
    return true;
  }

  const Model = getModel(name);
  if (!Model) return false;

  const pk = name === 'featureFlags' ? 'key' : 'id';
  const where = { [pk]: id };
  const col = ORG_COL[name];
  if (orgId && col) where[col] = orgId;

  try {
    const count = await Model.destroy({ where });
    return count > 0;
  } catch (err) {
    console.error('remove(%s, %s) error:', logSafe(name), logSafe(id), err.message);
    return false;
  }
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const findUserByEmail = async (email) => {
  if (!db) return null;
  try {
    const row = await db.users.findOne({ where: { email: email.toLowerCase() } });
    return convertRecord('users', row);
  } catch (err) {
    console.error('findUserByEmail error:', err.message);
    return null;
  }
};

const createSession = async (session) => {
  const item = {
    id: session.id || makeId('ses'),
    ...session,
    createdAt: session.createdAt || nowIso(),
  };
  mem.sessions.push(item);
  return JSON.parse(JSON.stringify(item));
};

const createLoginEvent = async (event) => {
  const item = {
    id: makeId('lev'),
    ...event,
    createdAt: event.createdAt || nowIso(),
  };
  (mem.loginHistory || (mem.loginHistory = [])).push(item);

  // Also persist as audit log if possible
  if (db && event.orgId && event.userId) {
    try {
      await db.audit_logs.create({
        org_id: event.orgId,
        admin_id: parseInt(event.userId) || 1,
        action: 'user.login',
        entity_type: 'user',
        entity_id: parseInt(event.userId) || 0,
        details: { ipAddress: event.ipAddress, success: event.success },
      });
    } catch (_) {}
  }
  return JSON.parse(JSON.stringify(item));
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const createAuditLog = async (entry) => {
  if (db && entry.orgId) {
    try {
      const idStr = entry.entityId == null ? null : String(entry.entityId);
      const isUuid = idStr && UUID_RE.test(idStr);
      const numericActor = entry.actorUserId != null && /^\d+$/.test(String(entry.actorUserId))
        ? Number(entry.actorUserId) : null;
      const row = await db.audit_logs.create({
        org_id: entry.orgId,
        actor_user_id: numericActor,
        admin_id: numericActor,                       // legacy column / association
        actor_type: numericActor ? 'user' : 'system',
        action: entry.action || 'unknown',
        entity_type: entry.entityType || 'unknown',
        entity_id: !isUuid && idStr && /^\d+$/.test(idStr) ? Number(idStr) : null,
        entity_uuid: isUuid ? idStr : null,           // preserve UUID entities (proxies, presets…)
        details: entry.details || {},
      });
      return convertRecord('auditLogs', row);
    } catch (err) {
      console.error('createAuditLog DB error (using memory):', err.message);
    }
  }
  const item = { id: makeId('aud'), ...entry, createdAt: nowIso() };
  (mem.auditLogs || []).push(item);
  return JSON.parse(JSON.stringify(item));
};

const createNotification = async (entry) => {
  if (db && entry.orgId) {
    try {
      const row = await db.notifications.create({
        org_id: entry.orgId,
        title: entry.title,
        body: entry.body || '',
      });
      return convertRecord('notifications', row);
    } catch (err) {
      console.warn('createNotification DB error:', err.message);
    }
  }
  return await insert('notifications', entry);
};

// Delegates to apiKeyService (single source of truth) — produces bvl_live_ keys
// with scopes persisted in api_key_scopes. Required lazily to avoid load-order
// coupling (apiKeyService also reads the models layer).
const createApiKey = async ({ orgId, name, createdBy, scopes, expiresAt = null, keyType = 'api' }) => {
  const apiKeyService = require('./apiKeyService');
  return apiKeyService.createKey({
    orgId, name, createdBy, scopes, expiresAt,
    keyType: keyType === 'proxy' ? 'proxy' : 'api', environment: 'live',
  });
};

// ─── Seed control ─────────────────────────────────────────────────────────────
let seedInitialized = false;
const ensureSeed = async () => {
  if (seedInitialized) return;
  seedInitialized = true;

  await runMigrations();

  if (process.env.NODE_ENV === 'development') {
    try {
      const seeder = require('../seeders/devSeed');
      await seeder.run();
    } catch (err) {
      console.warn('Dev seed warning:', err.message);
    }
  }
};

module.exports = {
  DEMO_PASSWORD: 'Baalvion123!',
  ensureSeed,
  paginate,
  getCollection,
  getById,
  insert,
  update,
  remove,
  findUserByEmail,
  createSession,
  createLoginEvent,
  createAuditLog,
  createNotification,
  createApiKey,
};
