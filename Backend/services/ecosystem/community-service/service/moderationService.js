'use strict';
// Every membership/moderation state change writes BOTH here (fast local query table) AND
// fire-and-forget onto the platform event bus (eventsClient) for audit-service's tamper-
// evident cross-domain record — additive, not either/or (see eventsClient.js header).
const db = require('../models');
const eventsClient = require('./eventsClient');

async function log({ communityId = null, actorUserId, action, targetUserId = null, targetEntityType = null, targetEntityId = null, details = {} }) {
    const row = await db.CommunityModerationLog.create({
        community_id: communityId,
        actor_user_id: actorUserId,
        action,
        target_user_id: targetUserId,
        target_entity_type: targetEntityType,
        target_entity_id: targetEntityId,
        details,
    });
    eventsClient.emit(`community.moderation.${action}`, {
        communityId, actorUserId, targetUserId, targetEntityType, targetEntityId, details,
    }, { userId: actorUserId }).catch(() => {});
    return row;
}

module.exports = { log };
