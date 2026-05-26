'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

const DEFAULT_PLANS = [
    {
        name: 'Starter',
        description: 'Perfect for small teams getting started with influencer marketing.',
        monthly_price: 999, annual_price: 9990, commission: 5.0,
        features: ['Up to 50 leads', '5 campaigns', 'Email outreach', 'Basic analytics'],
        limits: { leads: 50, campaigns: 5, team_members: 2 },
        is_active: true,
    },
    {
        name: 'Growth',
        description: 'For growing brands that need more power and automation.',
        monthly_price: 2999, annual_price: 29990, commission: 3.5,
        features: ['Up to 500 leads', '20 campaigns', 'Email & DM outreach', 'Advanced analytics', 'CRM', 'Proposals'],
        limits: { leads: 500, campaigns: 20, team_members: 10 },
        is_active: true,
    },
    {
        name: 'Enterprise',
        description: 'Full-featured plan for enterprise-level influencer programs.',
        monthly_price: 9999, annual_price: 99990, commission: 2.0,
        features: ['Unlimited leads', 'Unlimited campaigns', 'All outreach types', 'Custom analytics', 'Full CRM', 'Admin panel', 'Priority support'],
        limits: { leads: -1, campaigns: -1, team_members: -1 },
        is_active: true,
    },
];

exports.listPlans = async (req, res, next) => {
    try {
        let plans = await db.Plan.findAll({ where: { is_active: true }, order: [['monthly_price', 'ASC']] });
        if (plans.length === 0) {
            plans = await db.Plan.bulkCreate(DEFAULT_PLANS);
        }
        return sendSuccess(req, res, plans);
    } catch (err) { return next(err); }
};

exports.subscribe = async (req, res, next) => {
    try {
        const { plan } = req.body;
        if (!plan) return next(new AppError('VALIDATION', 'plan is required', 400));
        const planRecord = await db.Plan.findOne({ where: { name: plan, is_active: true } });
        if (!planRecord) return next(new AppError('NOT_FOUND', 'Plan not found', 404));
        const existing = await db.Subscription.findOne({ where: { org_id: req.user.orgId, status: 'active' } });
        if (existing) await existing.update({ status: 'cancelled' });
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        const subscription = await db.Subscription.create({
            org_id: req.user.orgId,
            plan_id: planRecord.id,
            status: 'active',
            current_period_start: now,
            current_period_end: periodEnd,
            cancel_at_period_end: false,
        });
        await db.Invoice.create({
            org_id: req.user.orgId,
            subscription_id: subscription.id,
            amount: planRecord.monthly_price,
            currency: 'INR',
            status: 'paid',
            plan_name: planRecord.name,
        });
        return sendSuccess(req, res, { subscription, plan: planRecord }, 201);
    } catch (err) { return next(err); }
};

exports.getSubscription = async (req, res, next) => {
    try {
        const subscription = await db.Subscription.findOne({
            where: { org_id: req.user.orgId },
            order: [['created_at', 'DESC']],
            include: [{ model: db.Plan, as: 'plan' }],
        });
        if (!subscription) return next(new AppError('NOT_FOUND', 'No subscription found', 404));
        return sendSuccess(req, res, subscription);
    } catch (err) { return next(err); }
};

exports.cancelSubscription = async (req, res, next) => {
    try {
        const subscription = await db.Subscription.findOne({
            where: { org_id: req.user.orgId, status: 'active' },
        });
        if (!subscription) return next(new AppError('NOT_FOUND', 'No active subscription found', 404));
        await subscription.update({ cancel_at_period_end: true });
        return sendSuccess(req, res, { message: 'Subscription will cancel at period end', subscription });
    } catch (err) { return next(err); }
};

exports.listInvoices = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const p = paginate(page, limit);
        const { rows, count } = await db.Invoice.findAndCountAll({
            where: { org_id: req.user.orgId },
            ...p,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};
