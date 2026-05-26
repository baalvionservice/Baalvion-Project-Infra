'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

exports.getOnboarding = async (req, res, next) => {
    try {
        let state = await db.OnboardingState.findOne({
            where: { org_id: req.user.orgId, user_id: req.user.id },
        });
        if (!state) {
            state = await db.OnboardingState.create({
                org_id: req.user.orgId,
                user_id: req.user.id,
                step: 0,
                data: {},
                completed: false,
            });
        }
        return sendSuccess(req, res, state);
    } catch (err) { return next(err); }
};

exports.saveStep = async (req, res, next) => {
    try {
        const { step, ...data } = req.body;
        if (step === undefined) return next(new AppError('VALIDATION', 'step is required', 400));
        let state = await db.OnboardingState.findOne({
            where: { org_id: req.user.orgId, user_id: req.user.id },
        });
        if (!state) {
            state = await db.OnboardingState.create({
                org_id: req.user.orgId,
                user_id: req.user.id,
                step,
                data,
                completed: false,
            });
        } else {
            const mergedData = { ...(state.data || {}), ...data };
            await state.update({ step: Math.max(state.step, Number(step)), data: mergedData });
        }
        return sendSuccess(req, res, state);
    } catch (err) { return next(err); }
};

exports.completeOnboarding = async (req, res, next) => {
    try {
        let state = await db.OnboardingState.findOne({
            where: { org_id: req.user.orgId, user_id: req.user.id },
        });
        if (!state) return next(new AppError('NOT_FOUND', 'Onboarding state not found', 404));
        await state.update({ completed: true, completed_at: new Date() });
        return sendSuccess(req, res, { message: 'Onboarding completed', state });
    } catch (err) { return next(err); }
};
