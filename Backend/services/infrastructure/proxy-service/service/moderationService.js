'use strict';

/**
 * Abuse moderation + takedown case management. Cases flow
 * OPEN → INVESTIGATING → ACTION_TAKEN → ESCALATED → RESOLVED | REJECTED.
 * Every transition is recorded in the append-only moderation_events history.
 * Taking action can drive the enforcement engine.
 */

const db = require('../models');
const complianceAudit = require('./complianceAudit');
const enforcement = require('./enforcementService');

const Q = db.Sequelize.QueryTypes;
const VALID = ['OPEN', 'INVESTIGATING', 'ACTION_TAKEN', 'ESCALATED', 'RESOLVED', 'REJECTED'];

async function createCase({ type, source, orgId = null, severity = 'medium', subject = null, details = {} }) {
  const [row] = await db.sequelize.query(
    `INSERT INTO moderation_cases (org_id, type, source, severity, subject, details)
     VALUES (NULLIF(:org,'')::uuid, :type, :source, :severity, :subject, :details::jsonb)
     RETURNING id`,
    { replacements: { org: orgId || '', type, source: source || null, severity, subject, details: JSON.stringify(details) }, type: Q.SELECT },
  );
  await recordEvent(row.id, null, 'created', null, 'OPEN', source || type);
  await complianceAudit.log({ domain: 'moderation', action: 'case.created', orgId, payload: { caseId: row.id, type } });
  return { id: row.id };
}

async function recordEvent(caseId, actorId, action, fromStatus, toStatus, note) {
  await db.sequelize.query(
    `INSERT INTO moderation_events (case_id, actor_id, action, from_status, to_status, note)
     VALUES (:c, :a, :action, :from, :to, :note)`,
    { replacements: { c: caseId, a: actorId || null, action, from: fromStatus || null, to: toStatus || null, note: note || null }, type: Q.INSERT },
  );
}

async function transition({ caseId, toStatus, actorId, note }) {
  if (!VALID.includes(toStatus)) throw new Error(`invalid status ${toStatus}`);
  const [cur] = await db.sequelize.query(`SELECT status, org_id FROM moderation_cases WHERE id = :id`, { replacements: { id: caseId }, type: Q.SELECT });
  if (!cur) throw new Error('case not found');
  const resolved = (toStatus === 'RESOLVED' || toStatus === 'REJECTED');
  await db.sequelize.query(
    `UPDATE moderation_cases SET status = :to, updated_at = now(), resolved_at = ${resolved ? 'now()' : 'resolved_at'} WHERE id = :id`,
    { replacements: { to: toStatus, id: caseId }, type: Q.UPDATE },
  );
  await recordEvent(caseId, actorId, 'transition', cur.status, toStatus, note);
  await complianceAudit.log({ domain: 'moderation', action: `transition:${toStatus}`, orgId: cur.org_id, actorId, payload: { caseId, from: cur.status } });
  return { caseId, status: toStatus };
}

async function assign({ caseId, assigneeId, actorId }) {
  await db.sequelize.query(`UPDATE moderation_cases SET assignee_id = :a, updated_at = now() WHERE id = :id`, { replacements: { a: assigneeId, id: caseId }, type: Q.UPDATE });
  await recordEvent(caseId, actorId, 'assign', null, null, `assigned to ${assigneeId}`);
  return { caseId, assigneeId };
}

/** Take enforcement action on the case's org and mark ACTION_TAKEN. */
async function actOn({ caseId, action, params = {}, reason, actorId }) {
  const [cur] = await db.sequelize.query(`SELECT status, org_id FROM moderation_cases WHERE id = :id`, { replacements: { id: caseId }, type: Q.SELECT });
  if (!cur || !cur.org_id) throw new Error('case has no org to action');
  await enforcement.apply({ orgId: cur.org_id, action, params, reason: reason || `moderation:${caseId}`, createdBy: actorId, caseId });
  await transition({ caseId, toStatus: 'ACTION_TAKEN', actorId, note: `enforcement: ${action}` });
  return { caseId, action };
}

async function listCases({ status, limit = 100 } = {}) {
  return db.sequelize.query(
    `SELECT * FROM moderation_cases ${status ? 'WHERE status = :status' : ''} ORDER BY created_at DESC LIMIT :limit`,
    { replacements: { status, limit: Number(limit) }, type: Q.SELECT },
  );
}

async function caseHistory(caseId) {
  return db.sequelize.query(`SELECT * FROM moderation_events WHERE case_id = :id ORDER BY created_at`, { replacements: { id: caseId }, type: Q.SELECT });
}

async function queueSize() {
  const [r] = await db.sequelize.query(`SELECT COUNT(*) AS n FROM moderation_cases WHERE status IN ('OPEN','INVESTIGATING','ESCALATED')`, { type: Q.SELECT });
  return Number(r.n) || 0;
}

module.exports = { createCase, transition, assign, actOn, listCases, caseHistory, queueSize, VALID };
