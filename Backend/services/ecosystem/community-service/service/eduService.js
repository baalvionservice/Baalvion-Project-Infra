'use strict';
// Education hub: vetted teachers, scheduled live sessions (hosted on the teacher's own
// meeting link), enrollment requests, and reviews. There are NO payments here by design:
// teachers state a price note, students and teachers settle directly. A meeting link is
// released only to the teacher and to students the teacher has approved.
const { Op, QueryTypes } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const events = require('./notifyEvents');

const PAGE_MAX = 200;
const defined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
const endOf = (s) => new Date(new Date(s.start_at).getTime() + s.duration_min * 60000);
const likeOf = (q) => `%${String(q).replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

// ── Serialisers ──────────────────────────────────────────────────────────────
const toTeacher = (r, extra = {}) => ({
    id: r.id, name: r.display_name, subject: r.subject, bio: r.bio, longBio: r.long_bio,
    regionId: r.region_id, country: r.country, priceNote: r.price_note, avatarUrl: r.avatar_url,
    tags: r.tags, skills: r.skills, education: r.education, status: r.status,
    memberSince: r.createdAt, rating: null, reviewCount: 0, studentsCount: 0, classesGiven: 0, isLive: false,
    ...extra,
});
const toSession = (r, { withUrl = false } = {}) => ({
    id: r.id, teacherId: r.teacher_id, title: r.title, description: r.description, startAt: r.start_at,
    durationMin: r.duration_min, capacity: r.capacity, status: r.status,
    teacher: r.teacher ? { id: r.teacher.id, name: r.teacher.display_name, subject: r.teacher.subject } : undefined,
    ...(withUrl ? { meetingUrl: r.meeting_url } : {}),
});
const toEnrollment = (r, { withUrl = false, withStudent = false } = {}) => ({
    id: r.id, sessionId: r.session_id, status: r.status, note: r.note, createdAt: r.createdAt,
    session: r.session ? toSession(r.session, { withUrl: withUrl && r.status === 'approved' }) : undefined,
    ...(withStudent ? { studentId: r.student_id, student: r.student_label } : {}),
});

// ── Aggregates ───────────────────────────────────────────────────────────────
async function teacherStats(ids) {
    if (!ids.length) return new Map();
    const rows = await db.sequelize.query(
        `SELECT t.id,
                (SELECT ROUND(AVG(rating)::numeric, 1) FROM community.edu_reviews WHERE teacher_id = t.id) AS rating,
                (SELECT COUNT(*) FROM community.edu_reviews WHERE teacher_id = t.id)::int AS "reviewCount",
                (SELECT COUNT(DISTINCT e.student_id) FROM community.edu_enrollments e
                   JOIN community.edu_sessions s ON s.id = e.session_id
                  WHERE s.teacher_id = t.id AND e.status = 'approved')::int AS "studentsCount",
                (SELECT COUNT(*) FROM community.edu_sessions s
                  WHERE s.teacher_id = t.id AND s.status = 'scheduled'
                    AND s.start_at + (s.duration_min * interval '1 minute') < NOW())::int AS "classesGiven",
                EXISTS (SELECT 1 FROM community.edu_sessions s
                  WHERE s.teacher_id = t.id AND s.status = 'scheduled'
                    AND s.start_at <= NOW() AND s.start_at + (s.duration_min * interval '1 minute') > NOW()) AS "isLive"
           FROM community.edu_teachers t WHERE t.id IN (:ids)`,
        { replacements: { ids }, type: QueryTypes.SELECT },
    );
    return new Map(rows.map((r) => [r.id, { ...r, rating: r.rating === null ? null : Number(r.rating) }]));
}

// Tell every student with a live request or approval that the session is off.
async function notifyCancelled(session) {
    const rows = await db.EduEnrollment.findAll({ where: { session_id: session.id, status: { [Op.in]: ['requested', 'approved'] } }, attributes: ['student_id'] });
    events.sessionCancelled(session, rows.map((r) => r.student_id));
}

// ── Public ───────────────────────────────────────────────────────────────────
async function listTeachers({ subject, regionId, country, q, limit, offset } = {}) {
    const where = { status: 'active' };
    if (subject) where.subject = { [Op.iLike]: likeOf(subject) };
    if (regionId) where.region_id = regionId;
    if (country) where.country = country;
    if (q) where[Op.or] = [{ display_name: { [Op.iLike]: likeOf(q) } }, { subject: { [Op.iLike]: likeOf(q) } }, { tags: { [Op.contains]: [q] } }];
    const { rows, count } = await db.EduTeacher.findAndCountAll({
        where, order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 60, PAGE_MAX), offset: Number(offset) || 0,
    });
    const stats = await teacherStats(rows.map((r) => r.id));
    return { items: rows.map((r) => toTeacher(r, stats.get(r.id))), total: count };
}

async function getTeacher(id) {
    const row = await db.EduTeacher.findByPk(id);
    if (!row || row.status !== 'active') throw new AppError('NOT_FOUND', 'Teacher not found', 404);
    const stats = await teacherStats([row.id]);
    const sessions = await db.EduSession.findAll({
        where: { teacher_id: row.id, status: 'scheduled', start_at: { [Op.gt]: new Date(Date.now() - 8 * 3600000) } },
        order: [['start_at', 'ASC']], limit: 20,
    });
    const reviews = await db.EduReview.findAll({ where: { teacher_id: row.id }, order: [['created_at', 'DESC']], limit: 20 });
    return {
        ...toTeacher(row, stats.get(row.id)),
        sessions: sessions.filter((s) => endOf(s) > new Date()).map((s) => toSession(s)),
        reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, student: r.student_label, createdAt: r.createdAt })),
    };
}

async function listUpcomingSessions({ liveOnly } = {}) {
    const rows = await db.EduSession.findAll({
        where: { status: 'scheduled', start_at: { [Op.gt]: new Date(Date.now() - 8 * 3600000) } },
        include: [{ model: db.EduTeacher, as: 'teacher', where: { status: 'active' } }],
        order: [['start_at', 'ASC']], limit: 100,
    });
    const now = new Date();
    return rows.filter((s) => endOf(s) > now && (!liveOnly || new Date(s.start_at) <= now)).map((s) => ({
        ...toSession(s), isLive: new Date(s.start_at) <= now,
    }));
}

// ── Teacher ──────────────────────────────────────────────────────────────────
const teacherColumns = (d) => ({
    display_name: d.displayName, subject: d.subject, bio: d.bio, long_bio: d.longBio, region_id: d.regionId,
    country: d.country, price_note: d.priceNote, avatar_url: d.avatarUrl, tags: d.tags, skills: d.skills, education: d.education,
});

async function getMyTeacher(userId) {
    const row = await db.EduTeacher.findOne({ where: { user_id: userId } });
    if (!row) return null;
    const stats = await teacherStats([row.id]);
    return toTeacher(row, { ...stats.get(row.id), reviewNote: row.review_note });
}

async function saveMyTeacher(userId, data) {
    const existing = await db.EduTeacher.findOne({ where: { user_id: userId } });
    if (existing && existing.status === 'suspended') throw new AppError('SUSPENDED', 'Your teacher account is suspended', 403);
    if (!existing) {
        const created = await db.EduTeacher.create({ ...defined(teacherColumns(data)), user_id: userId });
        events.teacherSubmitted(created);
        return toTeacher(created);
    }
    // A rejected application goes back to review once the teacher resubmits; an active teacher stays active.
    const reset = existing.status === 'rejected' ? { status: 'pending', review_note: null } : {};
    await existing.update({ ...defined(teacherColumns(data)), ...reset });
    if (existing.status === 'pending') events.teacherSubmitted(existing);
    return toTeacher(existing, { reviewNote: existing.review_note });
}

async function requireActiveTeacher(userId) {
    const t = await db.EduTeacher.findOne({ where: { user_id: userId } });
    if (!t) throw new AppError('TEACHER_REQUIRED', 'Apply as a teacher first', 403);
    if (t.status !== 'active') throw new AppError('TEACHER_NOT_ACTIVE', 'Your teacher application is not approved yet', 403);
    return t;
}

async function createSession(userId, d) {
    const teacher = await requireActiveTeacher(userId);
    if (new Date(d.startAt) < new Date()) throw new AppError('VALIDATION_ERROR', 'startAt: session must start in the future', 422);
    const row = await db.EduSession.create({
        teacher_id: teacher.id, title: d.title, description: d.description || null, start_at: d.startAt,
        duration_min: d.durationMin, capacity: d.capacity, meeting_url: d.meetingUrl,
    });
    return toSession(row, { withUrl: true });
}

async function listMySessions(userId) {
    const teacher = await requireActiveTeacher(userId);
    const rows = await db.EduSession.findAll({ where: { teacher_id: teacher.id }, order: [['start_at', 'DESC']], limit: 100 });
    const counts = rows.length ? await db.EduEnrollment.findAll({
        attributes: ['session_id', 'status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'n']],
        where: { session_id: rows.map((r) => r.id) }, group: ['session_id', 'status'], raw: true,
    }) : [];
    return rows.map((r) => {
        const mine = counts.filter((c) => c.session_id === r.id);
        const n = (st) => Number((mine.find((c) => c.status === st) || {}).n || 0);
        return { ...toSession(r, { withUrl: true }), requested: n('requested'), approved: n('approved') };
    });
}

async function loadOwnedSession(userId, sessionId) {
    const teacher = await requireActiveTeacher(userId);
    const s = await db.EduSession.findByPk(sessionId);
    if (!s || s.teacher_id !== teacher.id) throw new AppError('NOT_FOUND', 'Session not found', 404);
    return s;
}

async function updateMySession(userId, id, d) {
    const s = await loadOwnedSession(userId, id);
    const wasScheduled = s.status === 'scheduled';
    await s.update(defined({
        title: d.title, description: d.description, start_at: d.startAt, duration_min: d.durationMin,
        capacity: d.capacity, meeting_url: d.meetingUrl, status: d.status,
    }));
    if (wasScheduled && s.status === 'cancelled') await notifyCancelled(s);
    return toSession(s, { withUrl: true });
}

async function listSessionEnrollments(userId, sessionId) {
    const s = await loadOwnedSession(userId, sessionId);
    const rows = await db.EduEnrollment.findAll({ where: { session_id: s.id }, order: [['created_at', 'ASC']] });
    return rows.map((r) => toEnrollment(r, { withStudent: true }));
}

async function decideEnrollment(userId, enrollmentId, status) {
    const e = await db.EduEnrollment.findByPk(enrollmentId, { include: [{ model: db.EduSession, as: 'session' }] });
    if (!e) throw new AppError('NOT_FOUND', 'Enrollment not found', 404);
    await loadOwnedSession(userId, e.session_id);
    if (e.status === 'cancelled') throw new AppError('CONFLICT', 'The student cancelled this request', 409);
    if (status === 'approved') {
        const taken = await db.EduEnrollment.count({ where: { session_id: e.session_id, status: 'approved' } });
        if (e.status !== 'approved' && taken >= e.session.capacity) throw new AppError('SESSION_FULL', 'This session is full', 409);
    }
    const changed = e.status !== status;
    await e.update({ status });
    if (changed) events.enrollmentDecided(e, e.session);
    return toEnrollment(e, { withStudent: true });
}

// ── Student ──────────────────────────────────────────────────────────────────
async function enroll(userId, label, sessionId, note) {
    const s = await db.EduSession.findByPk(sessionId, { include: [{ model: db.EduTeacher, as: 'teacher' }] });
    if (!s || s.status !== 'scheduled' || s.teacher.status !== 'active' || endOf(s) <= new Date()) throw new AppError('NOT_FOUND', 'Session not found or already over', 404);
    if (s.teacher.user_id === userId) throw new AppError('FORBIDDEN', 'You cannot enroll in your own session', 403);
    const existing = await db.EduEnrollment.findOne({ where: { session_id: s.id, student_id: userId } });
    if (existing && existing.status !== 'cancelled') throw new AppError('ALREADY_ENROLLED', 'You already requested this session', 409);
    const row = existing
        ? await existing.update({ status: 'requested', note: note || null, student_label: label })
        : await db.EduEnrollment.create({ session_id: s.id, student_id: userId, student_label: label, note: note || null });
    events.enrollmentRequested(row, s, s.teacher.user_id, label);
    return toEnrollment(row);
}

async function listMyEnrollments(userId) {
    const rows = await db.EduEnrollment.findAll({
        where: { student_id: userId },
        include: [{ model: db.EduSession, as: 'session', include: [{ model: db.EduTeacher, as: 'teacher' }] }],
        order: [['created_at', 'DESC']], limit: 100,
    });
    return rows.map((r) => toEnrollment(r, { withUrl: true }));
}

async function cancelEnrollment(userId, id) {
    const e = await db.EduEnrollment.findByPk(id);
    if (!e || e.student_id !== userId) throw new AppError('NOT_FOUND', 'Enrollment not found', 404);
    await e.update({ status: 'cancelled' });
    return toEnrollment(e);
}

async function reviewTeacher(userId, label, teacherId, d) {
    const teacher = await db.EduTeacher.findByPk(teacherId);
    if (!teacher || teacher.status !== 'active') throw new AppError('NOT_FOUND', 'Teacher not found', 404);
    const attended = await db.EduEnrollment.findAll({
        where: { student_id: userId, status: 'approved' },
        include: [{ model: db.EduSession, as: 'session', where: { teacher_id: teacherId, status: 'scheduled' } }],
    });
    if (!attended.some((e) => endOf(e.session) < new Date())) {
        throw new AppError('NOT_ELIGIBLE', 'You can review a teacher after a session you were approved for has finished', 403);
    }
    const existing = await db.EduReview.findOne({ where: { teacher_id: teacherId, student_id: userId } });
    const payload = { rating: d.rating, comment: d.comment || null, student_label: label };
    const row = existing ? await existing.update(payload) : await db.EduReview.create({ ...payload, teacher_id: teacherId, student_id: userId });
    return { id: row.id, rating: row.rating, comment: row.comment };
}

// ── Admin ────────────────────────────────────────────────────────────────────
async function adminListTeachers({ status, limit, offset }) {
    const { rows, count } = await db.EduTeacher.findAndCountAll({
        where: status ? { status } : {}, order: [['created_at', 'ASC']],
        limit: Math.min(Number(limit) || 50, PAGE_MAX), offset: Number(offset) || 0,
    });
    return { items: rows.map((r) => toTeacher(r, { reviewNote: r.review_note, userId: r.user_id })), total: count };
}

async function adminReviewTeacher(id, adminId, { status, note }) {
    const row = await db.EduTeacher.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Teacher not found', 404);
    await row.update({ status, review_note: note || null, reviewed_by: adminId, reviewed_at: new Date() });
    events.teacherReviewed(row);
    return toTeacher(row, { reviewNote: row.review_note });
}

async function adminListSessions({ limit, offset }) {
    const { rows, count } = await db.EduSession.findAndCountAll({
        include: [{ model: db.EduTeacher, as: 'teacher' }], order: [['start_at', 'DESC']],
        limit: Math.min(Number(limit) || 50, PAGE_MAX), offset: Number(offset) || 0,
    });
    return { items: rows.map((r) => toSession(r)), total: count };
}

async function adminCancelSession(id) {
    const s = await db.EduSession.findByPk(id);
    if (!s) throw new AppError('NOT_FOUND', 'Session not found', 404);
    const wasScheduled = s.status === 'scheduled';
    await s.update({ status: 'cancelled' });
    if (wasScheduled) await notifyCancelled(s);
    return toSession(s);
}

module.exports = {
    listTeachers, getTeacher, listUpcomingSessions,
    getMyTeacher, saveMyTeacher, createSession, listMySessions, updateMySession, listSessionEnrollments, decideEnrollment,
    enroll, listMyEnrollments, cancelEnrollment, reviewTeacher,
    adminListTeachers, adminReviewTeacher, adminListSessions, adminCancelSession,
};
