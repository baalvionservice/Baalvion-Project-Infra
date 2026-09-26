'use strict';
const { AppError } = require('./errors');
const { SLUG_RE } = require('./peopleValidation');

// Mirror COURT_LEVELS / CASE_STATUSES in the site's types/legal.ts.
const COURT_LEVELS = ['trial', 'appellate', 'supreme', 'international', 'other'];
const CASE_STATUSES = ['ongoing', 'concluded', 'settled', 'dismissed', 'appealed'];

const fail = (msg) => { throw new AppError('VALIDATION_ERROR', msg, 400); };
const isText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

const checkArray = (data, key, label, rowCheck) => {
    if (!(key in data)) return;
    if (!Array.isArray(data[key])) fail(`${label} must be a list`);
    if (data[key].length > 100) fail(`${label} has too many rows`);
    data[key].forEach((row, i) => rowCheck(row, `${label} row ${i + 1}`));
};

const participant = (r, where) => {
    if (!r || !isText(r.name, 200)) fail(`${where}: name is required`);
    if (!isText(r.role, 200)) fail(`${where}: role is required`);
    if (r.personSlug && !SLUG_RE.test(r.personSlug)) fail(`${where}: person slug is not valid`);
};
const dated = (r, where) => {
    if (!r || !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(r.date || ''))) fail(`${where}: date must be YYYY, YYYY-MM or YYYY-MM-DD`);
    if (!isText(r.label || r.title, 300)) fail(`${where}: description is required`);
    // Timeline rows only (important-dates rows never set this) -- which court
    // this specific step happened at, when it's not (or not only) the case's
    // primary court_slug.
    if (r.courtSlug && !SLUG_RE.test(r.courtSlug)) fail(`${where}: court slug is not valid`);
};
const document = (r, where) => {
    if (!r || !isText(r.title, 300)) fail(`${where}: title is required`);
    // Only real, hosted, public sources: https links, never javascript: or internal addresses.
    if (!/^https:\/\/[^\s]+$/i.test(String(r.url || ''))) fail(`${where}: link must be an https URL`);
};

function validateCourt(data, isCreate) {
    if (isCreate || 'slug' in data) if (!SLUG_RE.test(String(data.slug || ''))) fail('slug must be lowercase words separated by hyphens');
    if (isCreate || 'name' in data) if (!isText(data.name, 300)) fail('name is required');
    if ('level' in data && !COURT_LEVELS.includes(data.level)) fail(`level must be one of ${COURT_LEVELS.join(', ')}`);
    if (data.country_code != null && data.country_code !== '' && !/^[A-Z]{2}$/.test(data.country_code)) fail('country_code must be a 2-letter ISO code');
    if (data.url && !/^https:\/\//i.test(data.url)) fail('url must be an https URL');
    if (data.appeals_from_court_slug && !SLUG_RE.test(data.appeals_from_court_slug)) fail('appeals_from_court_slug is not valid');
    if (data.indexable === true && data.published === false) fail('an unpublished court cannot be indexable');
}

function validateCase(data, isCreate) {
    if (isCreate || 'slug' in data) if (!SLUG_RE.test(String(data.slug || ''))) fail('slug must be lowercase words separated by hyphens');
    if (isCreate || 'case_name' in data) if (!isText(data.case_name, 400)) fail('case_name is required');
    // Optional: a case can exist before any court is on record (e.g. an
    // arrest, before charges/venue are known). When a value IS given it
    // still has to be a real slug, not free text.
    if (data.court_slug != null && data.court_slug !== '' && !SLUG_RE.test(String(data.court_slug))) fail('court_slug is not valid');
    if ('status' in data && !CASE_STATUSES.includes(data.status)) fail(`status must be one of ${CASE_STATUSES.join(', ')}`);
    if (data.country_code != null && data.country_code !== '' && !/^[A-Z]{2}$/.test(data.country_code)) fail('country_code must be a 2-letter ISO code');
    checkArray(data, 'parties', 'parties', participant);
    checkArray(data, 'lawyers', 'lawyers', participant);
    checkArray(data, 'judges', 'judges', participant);
    checkArray(data, 'important_dates', 'important dates', dated);
    checkArray(data, 'timeline', 'timeline', dated);
    checkArray(data, 'documents', 'documents', document);
    checkArray(data, 'related_article_slugs', 'related articles', (s, w) => { if (!SLUG_RE.test(String(s))) fail(`${w}: not a valid slug`); });
    if (data.indexable === true && data.published === false) fail('an unpublished case cannot be indexable');
}

module.exports = { COURT_LEVELS, CASE_STATUSES, validateCourt, validateCase };
