'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listLawyers = async (req, res, next) => {
    try {
        const {
            page = 1, limit = 20,
            specialization, jurisdiction, minRate, maxRate,
            minRating, verified, language, search,
        } = req.query;
        const where = { status: 'active' };
        if (specialization) where.specializations = { [Op.contains]: [specialization] };
        if (jurisdiction) where.jurisdictions = { [Op.contains]: [jurisdiction] };
        if (language) where.languages = { [Op.contains]: [language] };
        if (verified !== undefined) where.verified = verified === 'true';
        if (minRate) where.hourly_rate = { ...where.hourly_rate, [Op.gte]: Number(minRate) };
        if (maxRate) where.hourly_rate = { ...where.hourly_rate, [Op.lte]: Number(maxRate) };
        if (minRating) where.rating = { [Op.gte]: Number(minRating) };
        if (search) where[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { bio: { [Op.iLike]: `%${search}%` } },
        ];
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Lawyer.findAndCountAll({
            where,
            order: [['rating', 'DESC'], ['total_reviews', 'DESC']],
            limit: Number(limit),
            offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) },
        });
    } catch (err) { return next(err); }
};

const getLawyer = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findByPk(req.params.id);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        return sendSuccess(req, res, lawyer);
    } catch (err) { return next(err); }
};

const createLawyer = async (req, res, next) => {
    try {
        const existing = await db.Lawyer.findOne({ where: { user_id: req.user.id } });
        if (existing) return next(new AppError('CONFLICT', 'Lawyer profile already exists for this user', 409));
        const lawyer = await db.Lawyer.create({ ...req.body, user_id: req.user.id, status: 'pending' });
        return sendSuccess(req, res, lawyer, 201);
    } catch (err) { return next(err); }
};

const updateLawyer = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findByPk(req.params.id);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        if (lawyer.user_id !== String(req.user.id) && req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Not authorised to update this profile', 403));
        }
        const forbidden = ['rating', 'total_reviews', 'verified', 'status'];
        forbidden.forEach(f => delete req.body[f]);
        await lawyer.update(req.body);
        return sendSuccess(req, res, lawyer);
    } catch (err) { return next(err); }
};

const deleteLawyer = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findByPk(req.params.id);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        if (req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Admin only', 403));
        }
        await lawyer.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const getAvailability = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findByPk(req.params.id, { attributes: ['id', 'availability', 'name'] });
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        return sendSuccess(req, res, { availability: lawyer.availability, lawyerId: lawyer.id });
    } catch (err) { return next(err); }
};

const updateAvailability = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findByPk(req.params.id);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        if (lawyer.user_id !== String(req.user.id) && req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }
        await lawyer.update({ availability: req.body.availability });
        return sendSuccess(req, res, { availability: lawyer.availability });
    } catch (err) { return next(err); }
};

const verifyLawyer = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const lawyer = await db.Lawyer.findByPk(req.params.id);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        await lawyer.update({ verified: true, status: 'active' });
        return sendSuccess(req, res, lawyer);
    } catch (err) { return next(err); }
};

const getMyProfile = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));
        return sendSuccess(req, res, lawyer);
    } catch (err) { return next(err); }
};

module.exports = { listLawyers, getLawyer, createLawyer, updateLawyer, deleteLawyer, getAvailability, updateAvailability, verifyLawyer, getMyProfile };
