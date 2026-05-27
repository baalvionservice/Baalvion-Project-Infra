'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const buildPagination = (total, page, limit) => ({
    total, page, limit, totalPages: Math.ceil(total / limit),
});

// GET /community/posts — public
const listPosts = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = { status: 'active' };

        if (req.query.category) where.category = req.query.category;
        if (req.query.author_id) where.author_id = parseInt(req.query.author_id);

        const { count, rows } = await db.CommunityPost.findAndCountAll({
            where,
            limit,
            offset,
            order: [['is_pinned', 'DESC'], ['created_at', 'DESC']],
        });

        return sendPaginated(req, res, { items: rows, pagination: buildPagination(count, page, limit) });
    } catch (err) { return next(err); }
};

// POST /community/posts — auth
const createPost = async (req, res, next) => {
    try {
        const { title, content, category, tags, org_id } = req.body;
        if (!title) return next(new AppError('VALIDATION_ERROR', 'Title is required', 400));
        if (!content) return next(new AppError('VALIDATION_ERROR', 'Content is required', 400));

        const post = await db.CommunityPost.create({
            title,
            content,
            category: category || null,
            tags: tags || [],
            author_id: req.user.id,
            author_name: req.body.author_name || null,
            org_id: org_id || req.user.orgId || null,
            status: 'active',
        });

        return sendSuccess(req, res, post, 201);
    } catch (err) { return next(err); }
};

// GET /community/posts/:id — public
const getPost = async (req, res, next) => {
    try {
        const post = await db.CommunityPost.findByPk(parseInt(req.params.id), {
            include: [
                {
                    model: db.Comment,
                    as: 'comments',
                    where: { parent_id: null, status: 'active' },
                    required: false,
                    limit: 20,
                    order: [['created_at', 'ASC']],
                },
            ],
        });

        if (!post) return next(new AppError('NOT_FOUND', 'Post not found', 404));
        return sendSuccess(req, res, post);
    } catch (err) { return next(err); }
};

// PATCH /community/posts/:id — auth, author or admin
const updatePost = async (req, res, next) => {
    try {
        const post = await db.CommunityPost.findByPk(parseInt(req.params.id));
        if (!post) return next(new AppError('NOT_FOUND', 'Post not found', 404));

        if (post.author_id !== req.user.id && !(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r))) {
            return next(new AppError('FORBIDDEN', 'Not authorized', 403));
        }

        const allowed = ['title', 'content', 'category', 'tags', 'author_name'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        await post.update(updates);
        return sendSuccess(req, res, post);
    } catch (err) { return next(err); }
};

// DELETE /community/posts/:id — auth
const deletePost = async (req, res, next) => {
    try {
        const post = await db.CommunityPost.findByPk(parseInt(req.params.id));
        if (!post) return next(new AppError('NOT_FOUND', 'Post not found', 404));

        if (post.author_id !== req.user.id && !(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r))) {
            return next(new AppError('FORBIDDEN', 'Not authorized', 403));
        }

        await post.update({ status: 'removed' });
        return sendSuccess(req, res, { message: 'Post removed' });
    } catch (err) { return next(err); }
};

// POST /community/posts/:id/vote — auth
const votePost = async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id);
        const post = await db.CommunityPost.findByPk(postId);
        if (!post) return next(new AppError('NOT_FOUND', 'Post not found', 404));

        const { value } = req.body;
        if (value !== 1 && value !== -1) {
            return next(new AppError('VALIDATION_ERROR', 'Value must be 1 or -1', 400));
        }

        const existingVote = await db.Vote.findOne({
            where: { user_id: req.user.id, target_type: 'post', target_id: postId },
        });

        if (existingVote) {
            const oldValue = existingVote.value;
            if (oldValue === value) {
                // Remove vote
                await existingVote.destroy();
                if (value === 1) await post.decrement('upvotes');
                else await post.decrement('downvotes');
                return sendSuccess(req, res, { voted: false });
            } else {
                await existingVote.update({ value });
                if (value === 1) {
                    await post.increment('upvotes');
                    await post.decrement('downvotes');
                } else {
                    await post.decrement('upvotes');
                    await post.increment('downvotes');
                }
            }
        } else {
            await db.Vote.create({ user_id: req.user.id, target_type: 'post', target_id: postId, value });
            if (value === 1) await post.increment('upvotes');
            else await post.increment('downvotes');
        }

        await post.reload();
        return sendSuccess(req, res, { voted: true, upvotes: post.upvotes, downvotes: post.downvotes });
    } catch (err) { return next(err); }
};

// POST /community/posts/:id/pin — auth, admin only
const pinPost = async (req, res, next) => {
    try {
        if (!(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r))) {
            return next(new AppError('FORBIDDEN', 'Admin access required', 403));
        }

        const post = await db.CommunityPost.findByPk(parseInt(req.params.id));
        if (!post) return next(new AppError('NOT_FOUND', 'Post not found', 404));

        await post.update({ is_pinned: !post.is_pinned });
        return sendSuccess(req, res, { is_pinned: post.is_pinned });
    } catch (err) { return next(err); }
};

// GET /community/posts/:id/comments — public
const listComments = async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const offset = (page - 1) * limit;

        const { count, rows } = await db.Comment.findAndCountAll({
            where: { post_id: postId, parent_id: null, status: 'active' },
            limit,
            offset,
            order: [['created_at', 'ASC']],
            include: [
                {
                    model: db.Comment,
                    as: 'replies',
                    where: { status: 'active' },
                    required: false,
                    order: [['created_at', 'ASC']],
                },
            ],
        });

        return sendPaginated(req, res, { items: rows, pagination: buildPagination(count, page, limit) });
    } catch (err) { return next(err); }
};

// POST /community/posts/:id/comments — auth
const addComment = async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id);
        const post = await db.CommunityPost.findByPk(postId);
        if (!post) return next(new AppError('NOT_FOUND', 'Post not found', 404));

        const { content, parent_id } = req.body;
        if (!content) return next(new AppError('VALIDATION_ERROR', 'Content is required', 400));

        // Validate parent_id if provided
        if (parent_id) {
            const parent = await db.Comment.findOne({ where: { id: parseInt(parent_id), post_id: postId } });
            if (!parent) return next(new AppError('NOT_FOUND', 'Parent comment not found', 404));
        }

        const comment = await db.Comment.create({
            post_id: postId,
            author_id: req.user.id,
            author_name: req.body.author_name || null,
            content,
            parent_id: parent_id ? parseInt(parent_id) : null,
            status: 'active',
        });

        await post.increment('comments_count');
        return sendSuccess(req, res, comment, 201);
    } catch (err) { return next(err); }
};

// POST /community/comments/:id/vote — auth
const voteComment = async (req, res, next) => {
    try {
        const commentId = parseInt(req.params.id);
        const comment = await db.Comment.findByPk(commentId);
        if (!comment) return next(new AppError('NOT_FOUND', 'Comment not found', 404));

        const { value } = req.body;
        if (value !== 1 && value !== -1) {
            return next(new AppError('VALIDATION_ERROR', 'Value must be 1 or -1', 400));
        }

        const existingVote = await db.Vote.findOne({
            where: { user_id: req.user.id, target_type: 'comment', target_id: commentId },
        });

        if (existingVote) {
            const oldValue = existingVote.value;
            if (oldValue === value) {
                await existingVote.destroy();
                if (value === 1) await comment.decrement('upvotes');
                return sendSuccess(req, res, { voted: false, upvotes: comment.upvotes - 1 });
            }
            await existingVote.update({ value });
            if (value === 1) await comment.increment('upvotes');
            else await comment.decrement('upvotes');
        } else {
            await db.Vote.create({ user_id: req.user.id, target_type: 'comment', target_id: commentId, value });
            if (value === 1) await comment.increment('upvotes');
        }

        await comment.reload();
        return sendSuccess(req, res, { voted: true, upvotes: comment.upvotes });
    } catch (err) { return next(err); }
};

module.exports = {
    listPosts, createPost, getPost, updatePost, deletePost,
    votePost, pinPost, listComments, addComment, voteComment,
};
