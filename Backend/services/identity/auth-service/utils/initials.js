'use strict';
/**
 * @file utils/initials.js
 * @description Deterministic avatar initials from a user's name, with graceful fallbacks. Pure
 * (no I/O) so it is exhaustively unit-testable and reusable by every presenter. Always returns
 * 1–2 uppercase characters.
 *
 * Priority: first+last name → full_name (first + last word) → email local part → '?'.
 */
function computeInitials(user = {}) {
    const first = String(user.first_name || '').trim();
    const last  = String(user.last_name  || '').trim();
    if (first || last) {
        return ((first[0] || '') + (last[0] || '')).toUpperCase() || '?';
    }

    const full = String(user.full_name || '').trim();
    if (full) {
        const parts = full.split(/\s+/).filter(Boolean);
        const a = parts[0]?.[0] || '';
        const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
        return (a + b).toUpperCase() || '?';
    }

    const email = String(user.email || '').trim();
    return (email[0] || '?').toUpperCase();
}

/** Combine first/last (or fall back to an existing full name) into a single display name, or null. */
function displayNameFromParts({ firstName, lastName, fullName } = {}) {
    const combined = [firstName, lastName].map((v) => String(v || '').trim()).filter(Boolean).join(' ');
    return combined || (fullName ? String(fullName).trim() : null) || null;
}

module.exports = { computeInitials, displayNameFromParts };
