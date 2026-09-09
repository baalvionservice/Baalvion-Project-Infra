'use strict';
const { notFound } = require('../utils/errors');

/**
 * Reject path parameters that cannot be identifiers before they reach a query.
 *
 * Without this, `/cases/not-a-uuid` reached Postgres, which refused it with
 * `invalid input syntax for type uuid`, and the service answered 500. Three things were
 * wrong with that: 500 says "we are broken" when the truthful answer is "there is no such
 * thing"; it filled the log with unhandled-error entries for what is ordinary junk traffic;
 * and it made the shape of a malformed id distinguishable from a well-formed one that does
 * not exist, which is a small but free oracle.
 *
 * 404 is the honest answer, and the same one a well-formed unknown id gets.
 *
 * The list is explicit rather than "anything ending in Id", because several parameters here
 * are deliberately NOT uuids — an invitation token, a community slug, a profile handle, a
 * case reference — and silently rejecting those would break the routes that carry them.
 */
const UUID_PARAMS = Object.freeze([
    'id',
    'updateId',
    'participantId',
    'supporterId',
    'invitationId',
    'userId',
    'targetId',
    'communityId',
    'postId',
    'commentId',
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuidParams(req, _res, next) {
    for (const name of UUID_PARAMS) {
        const value = req.params[name];
        if (value !== undefined && !UUID.test(value)) return next(notFound('Resource'));
    }
    return next();
}

module.exports = { uuidParams, UUID_PARAMS, UUID };
