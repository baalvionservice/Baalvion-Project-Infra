'use strict';
/**
 * Phase 9 — unified auth audit. ONE canonical stream: auth.auth_audit_log.
 *
 * Emits the canonical event set with app_id (X-Baalvion-App), request IP + user-agent, and
 * canonical user/org/session/jti identifiers. Metadata is PII-sanitized. Writes are best-effort —
 * a failing audit insert NEVER breaks the auth response. Retention: AUTH_AUDIT_RETENTION_DAYS.
 */
const db = require('../models');

const EVENTS = Object.freeze({
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  REFRESH: 'refresh',
  TOKEN_REVOKED: 'token_revoked',
  ROLE_CHANGED: 'role_changed',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',
  IMPERSONATION_STARTED: 'impersonation_started',
  IMPERSONATION_ENDED: 'impersonation_ended',
});
const VALID = new Set(Object.values(EVENTS));
const WARN_EVENTS = new Set([EVENTS.LOGIN_FAILURE, EVENTS.TOKEN_REVOKED, EVENTS.IMPERSONATION_STARTED]);

// Drop obviously-sensitive metadata keys (defence-in-depth; callers should not pass secrets).
const SENSITIVE = /pass(word)?|secret|token|hash|mfa|otp|\bcode\b|authorization|cookie|private/i;
function sanitize(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE.test(k)) out[k] = '[redacted]';
    else if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = sanitize(v);
    else out[k] = v;
  }
  return out;
}

const appIdOf = (req) => (req && req.headers && (req.headers['x-baalvion-app'] || req.headers['x-baalvion-app-id'])) || null;
const ipOf = (req) => (req && (req.ip || (req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress))) || null;
const uaOf = (req) => (req && req.headers && req.headers['user-agent']) || null;

const RETENTION_DAYS = Number(process.env.AUTH_AUDIT_RETENTION_DAYS || 365);

/** Emit a canonical auth audit event. Best-effort; resolves to the written row shape. */
async function emit(eventType, fields = {}) {
  if (!VALID.has(eventType)) {
    // eslint-disable-next-line no-console
    console.warn('[audit] unknown event_type:', eventType);
  }
  const { req } = fields;
  const row = {
    event_type:      eventType,
    user_id:         fields.userId ?? null,
    org_id:          fields.orgId ?? null,
    session_id:      fields.sessionId ?? null,
    jti:             fields.jti ?? null,
    issuer:          fields.issuer ?? null,
    app_id:          fields.appId ?? appIdOf(req),
    impersonator_id: fields.impersonatorId ?? null,
    ip_address:      fields.ip ?? ipOf(req),
    user_agent:      fields.userAgent ?? uaOf(req),
    severity:        fields.severity || (WARN_EVENTS.has(eventType) ? 'warn' : 'info'),
    metadata:        sanitize(fields.metadata),
  };
  try {
    await db.sequelize.query(
      `INSERT INTO auth.auth_audit_log
         (event_type,user_id,org_id,session_id,jti,issuer,app_id,impersonator_id,ip_address,user_agent,severity,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      { bind: [row.event_type, row.user_id, row.org_id, row.session_id, row.jti, row.issuer, row.app_id, row.impersonator_id, row.ip_address, row.user_agent, row.severity, JSON.stringify(row.metadata)] },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[audit] write failed:', err.message); // never break the auth flow
  }
  return row;
}

/** Express middleware → attaches req.audit.log(eventType, fields) with request context pre-bound. */
function auditMiddleware(req, _res, next) {
  req.audit = { log: (eventType, fields = {}) => emit(eventType, { req, ...fields }) };
  next();
}

/** Retention purge — call from a scheduled job. */
async function purgeExpired() {
  return db.sequelize.query(
    "DELETE FROM auth.auth_audit_log WHERE created_at < NOW() - ($1 || ' days')::interval",
    { bind: [String(RETENTION_DAYS)] },
  );
}

module.exports = { EVENTS, emit, auditMiddleware, purgeExpired, sanitize, RETENTION_DAYS };
