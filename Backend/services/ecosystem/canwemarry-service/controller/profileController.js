'use strict';
const profileService = require('../service/profileService');
const { asyncHandler } = require('./asyncHandler');
const { sendSuccess } = require('../utils/response');

const getMine = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await profileService.getOwn(req.actor.userId)));

const upsertMine = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await profileService.upsert(req.actor.userId, req.body)));

const getByHandle = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await profileService.getPublicByHandle(req.params.handle)));

module.exports = { getMine, upsertMine, getByHandle };
