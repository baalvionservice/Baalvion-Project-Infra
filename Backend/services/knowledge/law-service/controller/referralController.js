'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const getMyCode = async (req, res, next) => {
    try {
        let referral = await db.Referral.findOne({
            where: { referrer_id: String(req.user.id), referee_id: null },
        });
        if (!referral) {
            let code = generateCode();
            let attempts = 0;
            while (await db.Referral.findOne({ where: { code } }) && attempts < 10) {
                code = generateCode();
                attempts++;
            }
            referral = await db.Referral.create({
                referrer_id: String(req.user.id),
                referee_id: null,
                code,
                status: 'pending',
                reward: 0,
            });
        }
        return sendSuccess(req, res, { code: referral.code, referralId: referral.id });
    } catch (err) { return next(err); }
};

const applyReferral = async (req, res, next) => {
    try {
        const { code } = req.body;
        if (!code) return next(new AppError('BAD_REQUEST', 'code is required', 400));
        const referral = await db.Referral.findOne({ where: { code, status: 'pending', referee_id: null } });
        if (!referral) return next(new AppError('NOT_FOUND', 'Referral code not found or already used', 404));
        if (referral.referrer_id === String(req.user.id)) {
            return next(new AppError('BAD_REQUEST', 'You cannot use your own referral code', 400));
        }
        await referral.update({ referee_id: String(req.user.id), status: 'completed', reward: 10.00 });
        return sendSuccess(req, res, { applied: true, reward: referral.reward });
    } catch (err) { return next(err); }
};

const getReferralStats = async (req, res, next) => {
    try {
        const total = await db.Referral.count({
            where: { referrer_id: String(req.user.id), status: 'completed' },
        });
        const rewardSum = await db.Referral.sum('reward', {
            where: { referrer_id: String(req.user.id), status: 'completed' },
        });
        const referrals = await db.Referral.findAll({
            where: { referrer_id: String(req.user.id) },
            order: [['created_at', 'DESC']],
            limit: 50,
        });
        return sendSuccess(req, res, {
            totalCompleted: total,
            totalReward: rewardSum || 0,
            referrals,
        });
    } catch (err) { return next(err); }
};

module.exports = { getMyCode, applyReferral, getReferralStats };
