'use strict';

/**
 * Maps a logical email CATEGORY to the verified SES sender it must originate from.
 *
 * The EmailService never lets a caller pick an arbitrary From address — it derives the
 * category from the method being called (auth/security/billing/…) and looks the address
 * up here, so every message is guaranteed to leave a verified sender and the platform's
 * sender reputation stays partitioned by purpose.
 */

/** @typedef {'auth'|'notifications'|'security'|'support'|'billing'|'invrel'} EmailCategory */

const CATEGORIES = ['auth', 'notifications', 'security', 'support', 'billing', 'invrel'];

/**
 * @param {import('./config').EmailConfig} config
 * @param {EmailCategory} category
 * @returns {{ address: string, from: string }} the bare address and a display-name From header
 */
function resolveSender(config, category) {
    const address = config.senders[category];
    if (!address) {
        throw new Error(`Unknown email category "${category}" — no sender configured`);
    }
    return { address, from: formatFrom(config.fromName, address) };
}

/**
 * Build an RFC 5322 From header. The display name is quoted defensively so a name
 * containing a comma or special character cannot corrupt the header.
 * @param {string} name
 * @param {string} address
 */
function formatFrom(name, address) {
    if (!name) return address;
    const safe = name.replace(/["\\\r\n]/g, '').trim();
    return `"${safe}" <${address}>`;
}

/**
 * Choose the Reply-To address for a category so replies land in the right inbox:
 *  - support  → support@   (help requests)
 *  - billing  → billing@   (invoices / payments)
 *  - invrel   → invrel@    (investor relations)
 *  - auth / security / notifications → the configured default (support@), which is
 *    acceptable for authentication mail (replies, if any, are expected by support).
 *
 * @param {import('./config').EmailConfig} config
 * @param {EmailCategory} category
 * @returns {string|undefined}
 */
function replyToFor(config, category) {
    switch (category) {
        case 'support': return config.senders.support;
        case 'billing': return config.senders.billing;
        case 'invrel':  return config.senders.invrel;
        default:        return config.replyTo; // auth / security / notifications
    }
}

module.exports = { resolveSender, formatFrom, replyToFor, CATEGORIES };
