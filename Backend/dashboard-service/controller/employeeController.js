'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op, fn, col } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

async function _createAuditLog(req, action, entity_type, entity_id) {
    try {
        await db.AuditLog.create({
            org_id: req.user.orgId,
            action,
            entity_type,
            entity_id,
            user_id: req.user.id,
            role: req.user.role,
            resource: req.originalUrl,
            ip_address: req.ip,
            status: 'Success',
            severity: 'Info',
        });
    } catch (_) { /* non-blocking */ }
}

exports.listEmployees = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { page, limit, department, status, business_id, search } = req.query;
        const where = { org_id: orgId };
        if (department) where.department = department;
        if (status) where.status = status;
        if (business_id) where.business_id = Number(business_id);
        if (search) where.name = { [Op.iLike]: `%${search}%` };

        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.Employee.findAndCountAll({
            where,
            include: [
                { model: db.Domain, as: 'business', attributes: ['id', 'name'], required: false },
                { model: db.Employee, as: 'manager', attributes: ['id', 'name'], required: false },
            ],
            limit: lim,
            offset,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.createEmployee = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { name, email, role, department, business_id, country, status, employment_type, join_date, salary, manager_id, performance_score } = req.body;
        if (!name || !email) return next(new AppError('VALIDATION_ERROR', 'name and email are required', 400));

        const existing = await db.Employee.findOne({ where: { email, org_id: orgId } });
        if (existing) return next(new AppError('CONFLICT', 'Employee with this email already exists', 409));

        const employee = await db.Employee.create({ name, email, role, department, business_id, country, status, employment_type, join_date, salary, manager_id, performance_score, org_id: orgId });
        await _createAuditLog(req, 'CREATE_EMPLOYEE', 'employee', String(employee.id));
        return sendSuccess(req, res, employee, 201);
    } catch (err) { return next(err); }
};

exports.getEmployee = async (req, res, next) => {
    try {
        const employee = await db.Employee.findOne({
            where: { id: req.params.id, org_id: req.user.orgId },
            include: [
                { model: db.Domain, as: 'business', attributes: ['id', 'name'], required: false },
                { model: db.Employee, as: 'manager', attributes: ['id', 'name'], required: false },
                { model: db.Task, as: 'assigned_tasks', required: false, limit: 10, order: [['created_at', 'DESC']] },
            ],
        });
        if (!employee) return next(new AppError('NOT_FOUND', 'Employee not found', 404));
        return sendSuccess(req, res, employee);
    } catch (err) { return next(err); }
};

exports.updateEmployee = async (req, res, next) => {
    try {
        const employee = await db.Employee.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!employee) return next(new AppError('NOT_FOUND', 'Employee not found', 404));
        await employee.update(req.body);
        await _createAuditLog(req, 'UPDATE_EMPLOYEE', 'employee', String(employee.id));
        return sendSuccess(req, res, employee);
    } catch (err) { return next(err); }
};

exports.getDepartments = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const employees = await db.Employee.findAll({ where: { org_id: orgId }, raw: true });

        const deptMap = {};
        for (const emp of employees) {
            const dept = emp.department || 'Unknown';
            if (!deptMap[dept]) deptMap[dept] = { department: dept, headcount: 0, total_salary: 0, avg_performance: 0, scores: [] };
            deptMap[dept].headcount++;
            deptMap[dept].total_salary += parseFloat(emp.salary) || 0;
            if (emp.performance_score) deptMap[dept].scores.push(parseFloat(emp.performance_score));
        }

        const departments = Object.values(deptMap).map((d) => ({
            department: d.department,
            headcount: d.headcount,
            avg_salary: d.headcount > 0 ? parseFloat((d.total_salary / d.headcount).toFixed(2)) : 0,
            avg_performance: d.scores.length > 0 ? parseFloat((d.scores.reduce((a, b) => a + b, 0) / d.scores.length).toFixed(2)) : 0,
        }));

        return sendSuccess(req, res, { departments });
    } catch (err) { return next(err); }
};

exports.getAttendance = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { employee_id, date_from, date_to, page, limit } = req.query;
        const where = { org_id: orgId };
        if (employee_id) where.employee_id = Number(employee_id);
        if (date_from || date_to) {
            where.date = {};
            if (date_from) where.date[Op.gte] = date_from;
            if (date_to) where.date[Op.lte] = date_to;
        }

        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.Attendance.findAndCountAll({
            where,
            include: [{ model: db.Employee, as: 'employee', attributes: ['id', 'name', 'department'], required: false }],
            limit: lim,
            offset,
            order: [['date', 'DESC']],
        });

        // Productivity stats
        const presentCount = rows.filter((r) => r.status === 'present').length;
        const productivity_rate = rows.length > 0 ? parseFloat(((presentCount / rows.length) * 100).toFixed(2)) : 0;

        return sendPaginated(req, res, {
            data: rows,
            total: count,
            page: Math.max(Number(page) || 1, 1),
            limit: lim,
            totalPages: Math.ceil(count / lim),
            stats: { productivity_rate, present_count: presentCount, total_records: rows.length },
        });
    } catch (err) { return next(err); }
};
