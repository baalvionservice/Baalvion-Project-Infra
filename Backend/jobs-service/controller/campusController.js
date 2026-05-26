'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

// ─── Colleges ────────────────────────────────────────────────────────────────

const listColleges = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, is_active } = req.query;
        const where = {};
        if (search) where.name = { [Op.iLike]: `%${search}%` };
        if (is_active !== undefined) where.is_active = is_active === 'true';

        const { rows, count } = await db.College.findAndCountAll({
            where,
            ...paginate(page, limit),
            order: [['name', 'ASC']],
        });

        const pg = Number(page);
        const lm = Math.min(Number(limit), 100);
        return res.json({
            success: true,
            data: rows,
            pagination: { total: count, page: pg, limit: lm, totalPages: Math.ceil(count / lm) },
        });
    } catch (err) { return next(err); }
};

const getCollege = async (req, res, next) => {
    try {
        const college = await db.College.findByPk(req.params.id, {
            include: [{ model: db.Student, as: 'students', limit: 5 }],
        });
        if (!college) throw new AppError('NOT_FOUND', 'College not found', 404);
        return sendSuccess(req, res, college);
    } catch (err) { return next(err); }
};

const createCollege = async (req, res, next) => {
    try {
        const { name, city, state, country, accreditation, website, contact_email, contact_phone } = req.body;
        if (!name) throw new AppError('VALIDATION_ERROR', 'name is required', 422);
        const college = await db.College.create({ name, city, state, country, accreditation, website, contact_email, contact_phone });
        return sendSuccess(req, res, college, 201);
    } catch (err) { return next(err); }
};

const updateCollege = async (req, res, next) => {
    try {
        const college = await db.College.findByPk(req.params.id);
        if (!college) throw new AppError('NOT_FOUND', 'College not found', 404);
        const fields = ['name', 'city', 'state', 'country', 'accreditation', 'website', 'contact_email', 'contact_phone', 'is_active', 'metadata'];
        fields.forEach(f => { if (req.body[f] !== undefined) college[f] = req.body[f]; });
        await college.save();
        return sendSuccess(req, res, college);
    } catch (err) { return next(err); }
};

const deleteCollege = async (req, res, next) => {
    try {
        const college = await db.College.findByPk(req.params.id);
        if (!college) throw new AppError('NOT_FOUND', 'College not found', 404);
        await college.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

// ─── Students ────────────────────────────────────────────────────────────────

const listStudents = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, college_id, status, is_placed } = req.query;
        const where = {};
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
            ];
        }
        if (college_id) where.college_id = college_id;
        if (status) where.status = status;
        if (is_placed !== undefined) where.is_placed = is_placed === 'true';

        const { rows, count } = await db.Student.findAndCountAll({
            where,
            include: [{ model: db.College, as: 'college', attributes: ['id', 'name', 'city'] }],
            ...paginate(page, limit),
            order: [['created_at', 'DESC']],
        });

        const pg = Number(page);
        const lm = Math.min(Number(limit), 100);
        return res.json({
            success: true,
            data: rows,
            pagination: { total: count, page: pg, limit: lm, totalPages: Math.ceil(count / lm) },
        });
    } catch (err) { return next(err); }
};

const getStudent = async (req, res, next) => {
    try {
        const student = await db.Student.findByPk(req.params.id, {
            include: [
                { model: db.College, as: 'college' },
                { model: db.Placement, as: 'placements' },
            ],
        });
        if (!student) throw new AppError('NOT_FOUND', 'Student not found', 404);
        return sendSuccess(req, res, student);
    } catch (err) { return next(err); }
};

const createStudent = async (req, res, next) => {
    try {
        const { name, email, college_id, course, degree, graduation_year, cgpa, phone, skills } = req.body;
        if (!name || !email) throw new AppError('VALIDATION_ERROR', 'name and email are required', 422);
        const student = await db.Student.create({ name, email, college_id, course, degree, graduation_year, cgpa, phone, skills: skills || [] });
        return sendSuccess(req, res, student, 201);
    } catch (err) { return next(err); }
};

const updateStudent = async (req, res, next) => {
    try {
        const student = await db.Student.findByPk(req.params.id);
        if (!student) throw new AppError('NOT_FOUND', 'Student not found', 404);
        const fields = ['name', 'email', 'college_id', 'course', 'degree', 'graduation_year', 'cgpa', 'phone', 'is_placed', 'status', 'ai_score', 'verified', 'company', 'role', 'documents', 'skills', 'metadata'];
        fields.forEach(f => { if (req.body[f] !== undefined) student[f] = req.body[f]; });
        await student.save();
        return sendSuccess(req, res, student);
    } catch (err) { return next(err); }
};

const deleteStudent = async (req, res, next) => {
    try {
        const student = await db.Student.findByPk(req.params.id);
        if (!student) throw new AppError('NOT_FOUND', 'Student not found', 404);
        await student.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

// ─── Placements ──────────────────────────────────────────────────────────────

const listPlacements = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, college_id, approved } = req.query;
        const where = {};
        if (approved !== undefined) where.approved = approved === 'true';
        if (college_id) where.college_id = college_id;

        const { rows, count } = await db.Placement.findAndCountAll({
            where,
            include: [
                { model: db.Student, as: 'student', attributes: ['id', 'name', 'email', 'course'] },
                { model: db.College, as: 'college', attributes: ['id', 'name'] },
            ],
            ...paginate(page, limit),
            order: [['created_at', 'DESC']],
        });

        const pg = Number(page);
        const lm = Math.min(Number(limit), 100);
        return res.json({
            success: true,
            data: rows,
            pagination: { total: count, page: pg, limit: lm, totalPages: Math.ceil(count / lm) },
        });
    } catch (err) { return next(err); }
};

const createPlacement = async (req, res, next) => {
    try {
        const { student_id, company_name, role, package_lpa, offer_letter_url, joining_date } = req.body;
        if (!student_id || !company_name || !role) {
            throw new AppError('VALIDATION_ERROR', 'student_id, company_name, and role are required', 422);
        }
        const student = await db.Student.findByPk(student_id);
        if (!student) throw new AppError('NOT_FOUND', 'Student not found', 404);

        const placement = await db.Placement.create({ student_id, college_id: student.college_id, company_name, role, package_lpa, offer_letter_url, joining_date });

        // Mark student as placed
        await student.update({ is_placed: true, company: company_name, role });
        return sendSuccess(req, res, placement, 201);
    } catch (err) { return next(err); }
};

const updatePlacement = async (req, res, next) => {
    try {
        const placement = await db.Placement.findByPk(req.params.id);
        if (!placement) throw new AppError('NOT_FOUND', 'Placement not found', 404);

        const adminId = req.auth?.id || req.auth?.userId;

        // Handle approval/rejection with audit log
        if (req.body.approved !== undefined) {
            const action = req.body.approved ? 'approved' : 'rejected';
            const auditLog = { action, adminId, timestamp: new Date().toISOString(), notes: req.body.notes };
            const logs = [...(placement.audit_logs || []), auditLog];
            await placement.update({ approved: req.body.approved, verified_by_admin_id: adminId, audit_logs: logs });
        } else {
            const fields = ['company_name', 'role', 'package_lpa', 'offer_letter_url', 'joining_date'];
            fields.forEach(f => { if (req.body[f] !== undefined) placement[f] = req.body[f]; });
            await placement.save();
        }
        return sendSuccess(req, res, placement);
    } catch (err) { return next(err); }
};

// ─── AI Matching (stub — returns scored candidates for a job) ─────────────────

const getAIMatches = async (req, res, next) => {
    try {
        const { job_id, limit = 10 } = req.query;
        // Return students with their AI scores, sorted descending
        const students = await db.Student.findAll({
            where: { ai_score: { [Op.not]: null }, status: 'approved' },
            order: [['ai_score', 'DESC']],
            limit: Math.min(Number(limit), 50),
            include: [{ model: db.College, as: 'college', attributes: ['id', 'name'] }],
        });
        return res.json({ success: true, data: students, pagination: { total: students.length, page: 1, limit: Number(limit), totalPages: 1 } });
    } catch (err) { return next(err); }
};

module.exports = {
    listColleges, getCollege, createCollege, updateCollege, deleteCollege,
    listStudents, getStudent, createStudent, updateStudent, deleteStudent,
    listPlacements, createPlacement, updatePlacement,
    getAIMatches,
};
