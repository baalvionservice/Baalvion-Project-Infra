'use strict';

/**
 * Agent training + certification. Courses hold ordered modules; agents enrol,
 * complete modules (progress tracked), then submit a score — passing the course's
 * `passing_score` issues a certificate and marks the enrollment certified.
 */

const crypto = require('node:crypto');
const db = require('../models');
const events = require('./events');
const { Errors } = require('../utils/errors');

// ── courses + modules ──
async function createCourse(data, actor) {
    return (await db.TrainingCourse.create({
        org_id: data.orgId ?? actor?.orgId ?? null, title: data.title, description: data.description ?? null,
        category: data.category ?? null, required: !!data.required, passing_score: data.passingScore ?? 70,
        status: data.status || 'published', created_by: actor?.userId ?? null,
    })).toJSON();
}

async function listCourses(orgScope, { status, category } = {}) {
    const where = {};
    if (orgScope) where.org_id = orgScope;
    if (status) where.status = status;
    if (category) where.category = category;
    const rows = await db.TrainingCourse.findAll({ where, order: [['created_at', 'DESC']] });
    return rows.map((r) => r.toJSON());
}

async function getCourse(id, orgScope, { withModules = false } = {}) {
    const c = await db.TrainingCourse.findByPk(id, withModules ? { include: [{ model: db.TrainingModule, as: 'modules' }] } : {});
    if (!c) throw Errors.notFound('Course not found');
    if (orgScope && c.org_id && c.org_id !== orgScope) throw Errors.forbidden('Course belongs to another organization');
    const j = c.toJSON();
    if (withModules && j.modules) j.modules.sort((a, b) => a.position - b.position);
    return j;
}

async function addModule(courseId, data, orgScope) {
    await getCourse(courseId, orgScope);
    return (await db.TrainingModule.create({
        course_id: courseId, title: data.title, position: data.position ?? 0,
        content_type: data.contentType || 'video', content_url: data.contentUrl ?? null, body: data.body ?? null, metadata: data.metadata ?? {},
    })).toJSON();
}

// ── enrollment + progress + certification ──
async function enroll(courseId, agentId, orgScope) {
    const course = await getCourse(courseId, orgScope);
    const agent = await db.Agent.findByPk(agentId);
    if (!agent) throw Errors.notFound('Agent not found');
    const [row] = await db.AgentEnrollment.findOrCreate({
        where: { agent_id: agentId, course_id: courseId },
        defaults: { agent_id: agentId, course_id: courseId, org_id: agent.org_id, status: 'enrolled' },
    });
    return row.toJSON();
}

async function getEnrollment(courseId, agentId) {
    const e = await db.AgentEnrollment.findOne({ where: { agent_id: agentId, course_id: courseId } });
    if (!e) throw Errors.notFound('Enrollment not found');
    return e;
}

async function completeModule(courseId, agentId, moduleId) {
    const e = await getEnrollment(courseId, agentId);
    const modules = await db.TrainingModule.findAll({ where: { course_id: courseId } });
    const total = modules.length || 1;
    const done = new Set(e.completed_modules || []);
    if (modules.some((m) => m.id === moduleId)) done.add(moduleId);
    const progress = Math.min(100, Math.round((done.size / total) * 100));
    const status = e.status === 'certified' ? 'certified' : (progress >= 100 ? 'completed' : 'in_progress');
    await e.update({ completed_modules: [...done], progress_pct: progress, status, updated_at: new Date() });
    return e.toJSON();
}

/** Submit a score; pass → certify + issue a certificate id. */
async function submitScore(courseId, agentId, score) {
    const course = await getCourse(courseId, null);
    const e = await getEnrollment(courseId, agentId);
    const s = Math.max(0, Math.min(100, Number(score)));
    const passed = s >= course.passing_score;
    const patch = { score: s, updated_at: new Date() };
    if (passed) {
        patch.status = 'certified';
        patch.certified_at = new Date();
        patch.certificate_id = e.certificate_id || `CERT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
        patch.progress_pct = 100;
    } else {
        patch.status = 'failed';
    }
    await e.update(patch);
    if (passed) await events.publish('agent.certified', { agentId, courseId, courseTitle: course.title, score: s, certificateId: patch.certificate_id }).catch(() => {});
    return { ...e.toJSON(), passed, passingScore: course.passing_score };
}

async function listEnrollments({ agentId, courseId, status } = {}) {
    const where = {};
    if (agentId) where.agent_id = agentId;
    if (courseId) where.course_id = courseId;
    if (status) where.status = status;
    const rows = await db.AgentEnrollment.findAll({ where, order: [['updated_at', 'DESC']] });
    return rows.map((r) => r.toJSON());
}

/** An agent's earned certificates. */
async function agentCertifications(agentId) {
    const rows = await db.AgentEnrollment.findAll({
        where: { agent_id: agentId, status: 'certified' },
        include: [{ model: db.TrainingCourse, as: 'course', attributes: ['title', 'category'] }],
        order: [['certified_at', 'DESC']],
    });
    return rows.map((r) => ({ courseId: r.course_id, course: r.course?.title, category: r.course?.category, certificateId: r.certificate_id, score: r.score, certifiedAt: r.certified_at }));
}

module.exports = { createCourse, listCourses, getCourse, addModule, enroll, completeModule, submitScore, listEnrollments, agentCertifications };
