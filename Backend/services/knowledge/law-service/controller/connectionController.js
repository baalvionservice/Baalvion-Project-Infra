'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

// Lawyer-to-lawyer networking (spec area 5): follow / connect / collaborate
// share one edge table (legal.lawyer_connections), discriminated by
// `relation`. Follows auto-accept (one-directional, like most social
// networks); connect/collaborate require the addressee to respond.

const myLawyer = async (req) => db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });

const LAWYER_ATTRS = ['id', 'name', 'profile_photo', 'country', 'city'];
const CONNECTION_INCLUDE = [
    { model: db.Lawyer, as: 'requester', attributes: LAWYER_ATTRS },
    { model: db.Lawyer, as: 'addressee', attributes: LAWYER_ATTRS },
];

const sendRequest = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));

        const { addresseeId, relation } = req.body || {};
        if (!['follow', 'connect', 'collaborate'].includes(relation)) {
            return next(new AppError('VALIDATION_ERROR', 'relation must be follow, connect, or collaborate', 422));
        }
        if (!addresseeId || Number(addresseeId) === lawyer.id) {
            return next(new AppError('VALIDATION_ERROR', 'addresseeId is required and must not be yourself', 422));
        }
        const addressee = await db.Lawyer.findByPk(Number(addresseeId));
        if (!addressee) return next(new AppError('NOT_FOUND', 'Addressee not found', 404));

        const [edge, created] = await db.LawyerConnection.findOrCreate({
            where: { requester_id: lawyer.id, addressee_id: addressee.id, relation },
            defaults: { status: relation === 'follow' ? 'accepted' : 'pending' },
        });
        if (!created && edge.status === 'declined') {
            // Allow re-requesting after a prior decline.
            await edge.update({ status: relation === 'follow' ? 'accepted' : 'pending' });
        }
        if (relation !== 'follow' && addressee.email) {
            const mailer = require('../service/mailer');
            db.Notification.create({
                user_id: addressee.user_id,
                type: 'lawyer_connection',
                title: `New ${relation} request`,
                message: `${lawyer.name} sent you a ${relation} request.`,
                read: false,
            }).catch(() => {});
        }
        return sendSuccess(req, res, edge, created ? 201 : 200);
    } catch (err) { return next(err); }
};

const respond = (nextStatus) => async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));
        const edge = await db.LawyerConnection.findByPk(req.params.id);
        if (!edge) return next(new AppError('NOT_FOUND', 'Request not found', 404));
        if (edge.addressee_id !== lawyer.id) return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        if (edge.status !== 'pending') return next(new AppError('CONFLICT', `Request is already ${edge.status}`, 409));
        await edge.update({ status: nextStatus });
        return sendSuccess(req, res, edge);
    } catch (err) { return next(err); }
};
const acceptRequest = respond('accepted');
const declineRequest = respond('declined');

// Unfollow / withdraw a pending request / remove an accepted connection —
// either party to an accepted edge, or the original requester of a pending one.
const removeConnection = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));
        const edge = await db.LawyerConnection.findByPk(req.params.id);
        if (!edge) return next(new AppError('NOT_FOUND', 'Request not found', 404));
        const isParty = edge.requester_id === lawyer.id || edge.addressee_id === lawyer.id;
        if (!isParty) return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        await edge.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const listConnections = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));
        const { box = 'connections', page = 1, limit = 20 } = req.query;

        let where;
        if (box === 'followers') where = { addressee_id: lawyer.id, relation: 'follow', status: 'accepted' };
        else if (box === 'following') where = { requester_id: lawyer.id, relation: 'follow', status: 'accepted' };
        else if (box === 'pending') where = { addressee_id: lawyer.id, relation: { [Op.in]: ['connect', 'collaborate'] }, status: 'pending' };
        else where = {
            [Op.or]: [{ requester_id: lawyer.id }, { addressee_id: lawyer.id }],
            relation: { [Op.in]: ['connect', 'collaborate'] },
            status: 'accepted',
        };

        const limitN = Math.min(Number(limit) || 20, 100);
        const offset = (Number(page) - 1) * limitN;
        const { count, rows } = await db.LawyerConnection.findAndCountAll({
            where, include: CONNECTION_INCLUDE, order: [['created_at', 'DESC']], limit: limitN, offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: limitN, totalPages: Math.ceil(count / limitN) },
        });
    } catch (err) { return next(err); }
};

// Aggregated "share legal updates" feed: posts (post_type='update') authored
// by lawyers I follow, across every group they belong to. Real data only —
// empty when the caller follows nobody or nobody has posted.
const feed = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));
        const following = await db.LawyerConnection.findAll({
            where: { requester_id: lawyer.id, relation: 'follow', status: 'accepted' },
            attributes: ['addressee_id'],
        });
        const followedIds = following.map((f) => f.addressee_id);
        if (!followedIds.length) return sendSuccess(req, res, []);
        const posts = await db.GroupPost.findAll({
            where: { author_id: { [Op.in]: followedIds }, post_type: 'update' },
            include: [
                { model: db.Lawyer, as: 'author', attributes: LAWYER_ATTRS },
                { model: db.DiscussionGroup, as: 'group', attributes: ['id', 'name', 'slug'] },
            ],
            order: [['created_at', 'DESC']],
            limit: 50,
        });
        return sendSuccess(req, res, posts);
    } catch (err) { return next(err); }
};

module.exports = { sendRequest, acceptRequest, declineRequest, removeConnection, listConnections, feed };
