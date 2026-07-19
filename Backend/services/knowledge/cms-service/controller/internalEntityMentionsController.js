'use strict';
const svc = require('../service/contentEntityMentionsService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const REQUIRED_FIELDS = ['entityType', 'entitySlug', 'entityName', 'entityUrl', 'matchedText'];

function isValidMention(m) {
    return m && typeof m === 'object' && REQUIRED_FIELDS.every((f) => typeof m[f] === 'string' && m[f].length > 0);
}

// INTERNAL — imperialpedia-service's entity-mention detector writes the
// resolved, already-capped link list here on publish/unpublish. Gated by the
// shared internal secret, same as the other /internal/* resolvers.
const replaceMentions = async (req, res, next) => {
    try {
        const mentions = Array.isArray(req.body.mentions) ? req.body.mentions : [];
        if (!mentions.every(isValidMention)) {
            return next(new AppError('VALIDATION_ERROR', 'Each mention requires entityType, entitySlug, entityName, entityUrl, matchedText', 400));
        }
        const result = await svc.replaceMentions(req.params.websiteSlug, req.params.slug, mentions);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { replaceMentions };
