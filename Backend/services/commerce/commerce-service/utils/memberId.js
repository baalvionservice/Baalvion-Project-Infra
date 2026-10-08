'use strict';
const { slugify } = require('./slugify');

// Member numbers are 8 digits, shown as HR-48291736. Random rather than sequential so the number
// says nothing about how many members there are or who joined first.
const MIN = 10000000;
const MAX = 99999999;

const randomMemberNumber = (rng = Math.random) => MIN + Math.floor(rng() * (MAX - MIN + 1));
const formatMemberNumber = (n) => `HR-${n}`;

// Accepts "HR-48291736", "hr-48291736" or "48291736". Anything else is null.
function parseMemberNumber(input) {
    const m = /^(?:hr-)?(\d{8})$/i.exec(String(input || '').trim());
    if (!m) return null;
    const n = Number(m[1]);
    return n >= MIN && n <= MAX ? n : null;
}

// The readable part of the profile URL. Cosmetic only: the member number is what identifies a person.
const profileSlug = (displayName, memberNumber) => slugify(displayName || '').slice(0, 60) || 'member';
const profilePath = (memberNumber, displayName) => `/u/${formatMemberNumber(memberNumber)}/${profileSlug(displayName, memberNumber)}`;

module.exports = { MIN, MAX, randomMemberNumber, formatMemberNumber, parseMemberNumber, profileSlug, profilePath };
