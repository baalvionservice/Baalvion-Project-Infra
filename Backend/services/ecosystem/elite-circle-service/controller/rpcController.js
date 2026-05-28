'use strict';
// Mirrors the three Supabase RPC functions used by the frontend.
const db = require('../models');
const config = require('../config/appConfig');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createNotification } = require('../utils/notify');

const SCHEMA = config.db.schema;

async function rpc(req, res, next) {
    try {
        const fn = req.params.fn;
        const args = req.body || {};

        if (fn === 'has_role') {
            const userId = args._user_id || req.auth?.userId;
            if (!userId) throw new AppError('BAD_REQUEST', '_user_id required', 400);
            const row = await db.UserRole.findOne({ where: { user_id: userId, role: args._role } });
            return sendSuccess(req, res, { data: !!row });
        }

        if (fn === 'increment_thread_views') {
            if (!args.thread_id) throw new AppError('BAD_REQUEST', 'thread_id required', 400);
            await db.sequelize.query(`SELECT ${SCHEMA}.increment_thread_views(:id)`, { replacements: { id: args.thread_id } });
            return sendSuccess(req, res, { data: null });
        }

        if (fn === 'create_notification') {
            if (!req.auth) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
            // Only admins may create notifications for arbitrary users.
            if (args.p_user_id !== req.auth.userId && !req.auth.roles.includes('admin')) {
                throw new AppError('FORBIDDEN', 'Not permitted', 403);
            }
            const id = await createNotification({
                userId: args.p_user_id, type: args.p_type, title: args.p_title,
                message: args.p_message, link: args.p_link || null,
            });
            return sendSuccess(req, res, { data: id });
        }

        throw new AppError('NOT_FOUND', `Unknown function '${fn}'`, 404);
    } catch (err) { return next(err); }
}

module.exports = { rpc };
