'use strict';
const db = require('../models');
const { cleanText, cleanBody } = require('../utils/sanitize');
const { notFound, conflict } = require('../utils/errors');

/**
 * A profile is created on demand rather than at provisioning time, so an account that has
 * only ever read the site leaves no public record at all.
 */
async function getOwn(userId) {
    const profile = await db.Profile.findByPk(userId);
    return profile ? serializeOwn(profile) : null;
}

async function upsert(userId, input) {
    const patch = {
        ...input,
        display_name: cleanText(input.displayName),
        bio: cleanBody(input.bio),
        handle: input.handle ? input.handle.toLowerCase() : undefined,
    };
    delete patch.displayName;

    // The handle is the only field visible to strangers, so a collision is reported as a
    // conflict rather than allowed to surface as a driver-level unique-violation.
    if (patch.handle) {
        const taken = await db.Profile.findOne({ where: { handle: patch.handle } });
        if (taken && taken.user_id !== userId) throw conflict('That handle is already taken.', { handle: ['taken'] });
    }

    const existing = await db.Profile.findByPk(userId);
    if (existing) {
        await existing.update(stripUndefined(patch));
        return serializeOwn(existing);
    }
    if (!patch.handle) throw conflict('A handle is required to create a profile.', { handle: ['required'] });
    const created = await db.Profile.create({ ...stripUndefined(patch), user_id: userId });
    return serializeOwn(created);
}

/**
 * The stranger-facing view. Location is withheld unless the person opted in, and a profile
 * that is not discoverable is not addressable by handle at all.
 */
async function getPublicByHandle(handle) {
    const profile = await db.Profile.findOne({ where: { handle: handle.toLowerCase() } });
    if (!profile || !profile.is_discoverable) throw notFound('Profile');
    return serializePublic(profile);
}

const stripUndefined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

const serializeOwn = (p) => ({
    userId: p.user_id,
    handle: p.handle,
    displayName: p.display_name,
    bio: p.bio,
    avatarUrl: p.avatar_url,
    countryCode: p.country_code,
    region: p.region,
    languages: p.languages,
    isDiscoverable: p.is_discoverable,
    showLocation: p.show_location,
    defaultCaseVisibility: p.default_case_visibility,
    createdAt: p.created_at,
});

const serializePublic = (p) => ({
    handle: p.handle,
    displayName: p.display_name,
    bio: p.bio,
    avatarUrl: p.avatar_url,
    countryCode: p.show_location ? p.country_code : null,
    region: p.show_location ? p.region : null,
    languages: p.languages,
});

module.exports = { getOwn, upsert, getPublicByHandle, serializeOwn, serializePublic };
