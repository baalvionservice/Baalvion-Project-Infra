'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const myLawyer = async (req) => db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });

const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const listGroups = async (req, res, next) => {
    try {
        const groups = await db.DiscussionGroup.findAll({
            where: { is_active: true },
            attributes: {
                include: [[db.sequelize.literal('(SELECT COUNT(*) FROM legal.group_members gm WHERE gm.group_id = "DiscussionGroup"."id")'), 'memberCount']],
            },
            order: [['name', 'ASC']],
        });
        return sendSuccess(req, res, groups);
    } catch (err) { return next(err); }
};

const createGroup = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));
        const { name, description } = req.body || {};
        if (!name) return next(new AppError('VALIDATION_ERROR', 'name is required', 422));
        const slug = slugify(name);
        const existing = await db.DiscussionGroup.findOne({ where: { slug } });
        if (existing) return next(new AppError('CONFLICT', 'A group with this name already exists', 409));
        const group = await db.DiscussionGroup.create({ name, slug, description, created_by: lawyer.id });
        await db.GroupMember.create({ group_id: group.id, lawyer_id: lawyer.id, role: 'moderator' });
        return sendSuccess(req, res, group, 201);
    } catch (err) { return next(err); }
};

const resolveGroup = async (slugOrId) => {
    const where = isNaN(Number(slugOrId)) ? { slug: slugOrId } : { id: Number(slugOrId) };
    return db.DiscussionGroup.findOne({ where });
};

const getGroup = async (req, res, next) => {
    try {
        const group = await resolveGroup(req.params.slugOrId);
        if (!group) return next(new AppError('NOT_FOUND', 'Group not found', 404));
        const memberCount = await db.GroupMember.count({ where: { group_id: group.id } });
        return sendSuccess(req, res, { ...group.toJSON(), memberCount });
    } catch (err) { return next(err); }
};

const joinGroup = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));
        const group = await resolveGroup(req.params.slugOrId);
        if (!group) return next(new AppError('NOT_FOUND', 'Group not found', 404));
        const [membership] = await db.GroupMember.findOrCreate({
            where: { group_id: group.id, lawyer_id: lawyer.id },
            defaults: { role: 'member' },
        });
        return sendSuccess(req, res, membership, 201);
    } catch (err) { return next(err); }
};

const leaveGroup = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));
        const group = await resolveGroup(req.params.slugOrId);
        if (!group) return next(new AppError('NOT_FOUND', 'Group not found', 404));
        await db.GroupMember.destroy({ where: { group_id: group.id, lawyer_id: lawyer.id } });
        return sendSuccess(req, res, { left: true });
    } catch (err) { return next(err); }
};

const POST_INCLUDE = [
    { model: db.Lawyer, as: 'author', attributes: ['id', 'name', 'profile_photo'] },
];

const listPosts = async (req, res, next) => {
    try {
        const group = await resolveGroup(req.params.slugOrId);
        if (!group) return next(new AppError('NOT_FOUND', 'Group not found', 404));
        const { page = 1, limit = 20 } = req.query;
        const limitN = Math.min(Number(limit) || 20, 100);
        const offset = (Number(page) - 1) * limitN;
        // Top-level posts only (updates + questions); answers are nested per-question.
        const { count, rows } = await db.GroupPost.findAndCountAll({
            where: { group_id: group.id, parent_post_id: null },
            include: [
                ...POST_INCLUDE,
                {
                    model: db.GroupPost, as: 'answers',
                    include: [{ model: db.Lawyer, as: 'author', attributes: ['id', 'name', 'profile_photo'] }],
                },
            ],
            order: [['created_at', 'DESC']],
            limit: limitN,
            offset,
            distinct: true,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: limitN, totalPages: Math.ceil(count / limitN) },
        });
    } catch (err) { return next(err); }
};

const createPost = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));
        const group = await resolveGroup(req.params.slugOrId);
        if (!group) return next(new AppError('NOT_FOUND', 'Group not found', 404));

        const isMember = await db.GroupMember.findOne({ where: { group_id: group.id, lawyer_id: lawyer.id } });
        if (!isMember) return next(new AppError('FORBIDDEN', 'Join the group before posting', 403));

        const { content, postType = 'update', parentPostId } = req.body || {};
        if (!content) return next(new AppError('VALIDATION_ERROR', 'content is required', 422));
        if (!['update', 'question', 'answer'].includes(postType)) {
            return next(new AppError('VALIDATION_ERROR', 'postType must be update, question, or answer', 422));
        }
        if (postType === 'answer') {
            if (!parentPostId) return next(new AppError('VALIDATION_ERROR', 'parentPostId is required for an answer', 422));
            const parent = await db.GroupPost.findOne({ where: { id: Number(parentPostId), group_id: group.id, post_type: 'question' } });
            if (!parent) return next(new AppError('VALIDATION_ERROR', 'parentPostId must reference a question in this group', 422));
        }
        const post = await db.GroupPost.create({
            group_id: group.id,
            author_id: lawyer.id,
            post_type: postType,
            parent_post_id: postType === 'answer' ? Number(parentPostId) : null,
            content,
        });
        const full = await db.GroupPost.findByPk(post.id, { include: POST_INCLUDE });
        return sendSuccess(req, res, full, 201);
    } catch (err) { return next(err); }
};

module.exports = { listGroups, createGroup, getGroup, joinGroup, leaveGroup, listPosts, createPost };
