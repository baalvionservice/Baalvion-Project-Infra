'use strict';
// Email-domain helpers used to gate deal-room eligibility. A "company" (corporate) email is
// any deliverable-looking address whose domain is NOT a well-known free / personal / disposable
// provider. The list is curated and intentionally conservative — we only block the obvious
// consumer providers so a legitimate institutional applicant is never rejected by accident.

const FREE_EMAIL_DOMAINS = new Set([
    // Google
    'gmail.com', 'googlemail.com',
    // Microsoft
    'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'msn.com', 'outlook.in',
    // Yahoo / AOL / Verizon
    'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com', 'aol.com',
    // Apple
    'icloud.com', 'me.com', 'mac.com',
    // Proton / privacy
    'proton.me', 'protonmail.com', 'pm.me', 'tutanota.com', 'tuta.io',
    // Other consumer webmail
    'gmx.com', 'gmx.net', 'mail.com', 'zoho.com', 'yandex.com', 'yandex.ru',
    'fastmail.com', 'hey.com', 'inbox.com',
    // Regional consumer providers
    'qq.com', '163.com', '126.com', 'sina.com', 'rediffmail.com',
    // Disposable / throwaway (common offenders)
    'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
    'temp-mail.org', 'trashmail.com', 'yopmail.com', 'getnada.com', 'dispostable.com',
]);

/** Returns the lowercased domain part of an email, or null if it isn't a plausible address. */
const emailDomain = (email) => {
    if (typeof email !== 'string') return null;
    const at = email.lastIndexOf('@');
    if (at <= 0 || at === email.length - 1) return null;
    const domain = email.slice(at + 1).trim().toLowerCase();
    return domain.includes('.') ? domain : null;
};

/** True when the email belongs to a corporate domain (not a known free/personal/disposable one). */
const isCompanyEmail = (email) => {
    const domain = emailDomain(email);
    if (!domain) return false;
    return !FREE_EMAIL_DOMAINS.has(domain);
};

module.exports = { FREE_EMAIL_DOMAINS, emailDomain, isCompanyEmail };
