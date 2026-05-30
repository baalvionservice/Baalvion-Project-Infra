'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

// GET /community/debates — public. Returns the full DebateNode array.
const listDebates = async (req, res, next) => {
    try {
        const rows = await db.CommunityDebate.findAll({ order: [['created_at', 'DESC']] });
        return sendSuccess(req, res, rows.map((r) => r.meta));
    } catch (err) { return next(err); }
};

// GET /community/debates/:id — public (id = DebateNode.id / ref).
const getDebate = async (req, res, next) => {
    try {
        const row = await db.CommunityDebate.findOne({ where: { ref: req.params.id } });
        if (!row) return next(new AppError('NOT_FOUND', 'Debate not found', 404));
        return sendSuccess(req, res, row.meta);
    } catch (err) { return next(err); }
};

// GET /community/debates-leaderboard — public. Derived from debate participation.
const debateLeaderboard = async (req, res, next) => {
    try {
        const rows = await db.CommunityDebate.findAll();
        const tally = {};
        for (const r of rows) {
            const m = r.meta || {};
            for (const side of ['bull_arguments', 'bear_arguments']) {
                for (const a of m[side] || []) {
                    const k = a.user || 'Anonymous';
                    tally[k] = tally[k] || { name: k, avatar: a.avatar, debates_won: 0, reputation: 0 };
                    tally[k].reputation += (a.likes || 0) + (a.reputation || 0);
                }
            }
            const winner = (m.community_votes?.bull ?? 0) >= (m.community_votes?.bear ?? 0) ? 'bull_arguments' : 'bear_arguments';
            const top = (m[winner] || [])[0];
            if (top?.user && tally[top.user]) tally[top.user].debates_won += 1;
        }
        const list = Object.values(tally)
            .sort((a, b) => b.reputation - a.reputation)
            .map((e, i) => ({ rank: i + 1, ...e }));
        return sendSuccess(req, res, list);
    } catch (err) { return next(err); }
};

// GET /community/sentiment — public. Returns the full AssetSentiment array.
const listSentiment = async (req, res, next) => {
    try {
        const rows = await db.AssetSentiment.findAll({ order: [['ticker', 'ASC']] });
        return sendSuccess(req, res, rows.map((r) => r.meta));
    } catch (err) { return next(err); }
};

module.exports = { listDebates, getDebate, debateLeaderboard, listSentiment };
