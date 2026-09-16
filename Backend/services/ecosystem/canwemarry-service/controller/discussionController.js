'use strict';
const postService = require('../service/postService');
const commentService = require('../service/commentService');
const reactionService = require('../service/reactionService');
const accessContext = require('../service/accessContext');
const { asyncHandler, q } = require('./asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');

const ctxOf = (req) => accessContext.build(req);

const listPosts = asyncHandler(async (req, res) => {
    const { page, pageSize, communityId } = q(req);
    const { items, total } = await postService.list(await ctxOf(req), { communityId, page, pageSize });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

const getPost = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await postService.get(await ctxOf(req), req.params.id)));

const createPost = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await postService.create(await ctxOf(req), req.body), 201));

const updatePost = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await postService.update(await ctxOf(req), req.params.id, req.body)));

const deletePost = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await postService.remove(await ctxOf(req), req.params.id)));

const listComments = asyncHandler(async (req, res) => {
    const { page, pageSize, targetType, targetId } = q(req);
    const { items, total } = await commentService.list(await ctxOf(req), { targetType, targetId, page, pageSize });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

const createComment = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await commentService.create(await ctxOf(req), req.body), 201));

const updateComment = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await commentService.update(await ctxOf(req), req.params.id, req.body.body)));

const deleteComment = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await commentService.remove(await ctxOf(req), req.params.id)));

const setReaction = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await reactionService.set(await ctxOf(req), req.body), 201));

const clearReaction = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await reactionService.clear(await ctxOf(req), {
        targetType: req.params.targetType, targetId: req.params.targetId,
    })));

const reactionSummary = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await reactionService.summary(await ctxOf(req), {
        targetType: req.params.targetType, targetId: req.params.targetId,
    })));

module.exports = {
    listPosts, getPost, createPost, updatePost, deletePost,
    listComments, createComment, updateComment, deleteComment,
    setReaction, clearReaction, reactionSummary,
};
